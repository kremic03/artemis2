import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, MathUtils, Matrix4, Quaternion, Vector3 } from 'three'
import { useMission } from '@features/mission/MissionContext'
import {
  TRAJECTORY_CONTROL_POINTS,
  MOON_POS,
  KSC_SURFACE,
  KSC_NORMAL,
} from '@shared/constants/trajectory'
import { ROCKET_FLIGHT_TUNING } from '@shared/constants/scene'

const curve = new CatmullRomCurve3(TRAJECTORY_CONTROL_POINTS)

const ROCKET_NOSE = new Vector3(0, 1, 0)
const SURFACE_QUAT = new Quaternion().setFromUnitVectors(ROCKET_NOSE, KSC_NORMAL)

const _targetPos = new Vector3()
const _aheadPos = new Vector3()
const _behindPos = new Vector3()
const _forward = new Vector3()
const _upHint = new Vector3()
const _earthUp = new Vector3()
const _moonUp = new Vector3()
const _right = new Vector3()
const _up = new Vector3()
const _prevPos = new Vector3()
const _newVelocity = new Vector3()
const _newAcceleration = new Vector3()
const _matrix = new Matrix4()
const _targetQuat = new Quaternion()
const _bankQuat = new Quaternion()
const _turnAxis = new Vector3()
const _swayAxis = new Vector3()
const _swayOffset = new Vector3()
const _pitchAxis = new Vector3()
const _pitchQuat = new Quaternion()

function alpha(responsiveness, delta) {
  return 1 - Math.exp(-responsiveness * delta)
}

function buildQuaternion(forward, upHint, bank) {
  _right.crossVectors(forward, upHint).normalize()

  if (_right.lengthSq() < 1e-4) {
    _right.set(1, 0, 0).cross(forward).normalize()
  }

  _up.crossVectors(_right, forward).normalize()
  // RocketModel's nose is local +Y, so the basis maps:
  // local X -> right, local Y -> forward, local Z -> visual up.
  _matrix.makeBasis(_right, forward, _up)
  _targetQuat.setFromRotationMatrix(_matrix)
  _bankQuat.setFromAxisAngle(forward, bank)
  _targetQuat.multiply(_bankQuat)
  return _targetQuat
}

export function useRocketPosition(groupRef) {
  const { tRef, flightRef } = useMission()
  const currentPos = useRef(KSC_SURFACE.clone())
  const currentVel = useRef(new Vector3())
  const currentAcc = useRef(new Vector3())
  const currentForward = useRef(KSC_NORMAL.clone())
  const currentUp = useRef(new Vector3(0, 0, 1).projectOnPlane(KSC_NORMAL).normalize())
  const currentQuat = useRef(SURFACE_QUAT.clone())
  const currentBank = useRef(0)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const t = Math.max(0, Math.min(tRef.current, 0.9998))
    const elapsed = state.clock.elapsedTime

    if (t <= 0.0002) {
      currentPos.current.copy(KSC_SURFACE)
      currentVel.current.set(0, 0, 0)
      currentAcc.current.set(0, 0, 0)
      currentForward.current.copy(KSC_NORMAL)
      currentUp.current.set(0, 0, 1).projectOnPlane(KSC_NORMAL).normalize()
      currentQuat.current.copy(SURFACE_QUAT)
      currentBank.current = 0

      groupRef.current.position.copy(KSC_SURFACE)
      groupRef.current.quaternion.copy(SURFACE_QUAT)

      flightRef.current.position.copy(KSC_SURFACE)
      flightRef.current.velocity.set(0, 0, 0)
      flightRef.current.acceleration.set(0, 0, 0)
      flightRef.current.forward.copy(KSC_NORMAL)
      flightRef.current.up.copy(currentUp.current)
      flightRef.current.bank = 0
      flightRef.current.speed = 0
      return
    }

    curve.getPointAt(t, _targetPos)
    curve.getPointAt(Math.max(0, t - ROCKET_FLIGHT_TUNING.lookAheadT * 0.7), _behindPos)
    curve.getPointAt(Math.min(0.9998, t + ROCKET_FLIGHT_TUNING.lookAheadT), _aheadPos)

    // Subtle ascent oscillation: sway perpendicular to surface normal as if
    // gimballing against cross-winds. Ramps in after ignition, fades out at orbit.
    if (t > 0.002 && t < 0.085) {
      const rampIn  = MathUtils.smoothstep(t, 0.004, 0.020)
      const rampOut = 1 - MathUtils.smoothstep(t, 0.060, 0.085)
      const amp = ROCKET_FLIGHT_TUNING.ascentSwayAmp * rampIn * rampOut
      if (amp > 1e-5) {
        _earthUp.copy(_targetPos).normalize()
        _swayAxis.crossVectors(_aheadPos.clone().sub(_behindPos).normalize(), _earthUp).normalize()
        const sway = Math.sin(elapsed * ROCKET_FLIGHT_TUNING.ascentSwayFreq) * amp
                   + Math.sin(elapsed * ROCKET_FLIGHT_TUNING.ascentSwayFreq * 1.73 + 0.7) * amp * 0.35
        _swayOffset.copy(_swayAxis).multiplyScalar(sway)
        _targetPos.add(_swayOffset)
      }
    }

    _prevPos.copy(currentPos.current)
    currentPos.current.copy(_targetPos)
    groupRef.current.position.copy(currentPos.current)

    if (delta > 1e-5) {
      _newVelocity.copy(currentPos.current).sub(_prevPos).divideScalar(delta)
      _newAcceleration.copy(_newVelocity).sub(currentVel.current).divideScalar(delta)
      currentVel.current.copy(_newVelocity)
      currentAcc.current.lerp(_newAcceleration, alpha(5.5, delta))
    }

    _forward.copy(_aheadPos).sub(_behindPos).normalize()
    if (t < 0.055) {
      _forward.lerp(KSC_NORMAL, 1 - MathUtils.smoothstep(t, 0.01, 0.055)).normalize()
    }

    _earthUp.copy(currentPos.current).normalize()
    _moonUp.copy(currentPos.current).sub(MOON_POS).normalize()
    const lunarBlend = MathUtils.smoothstep(t, 0.60, 0.665) * (1 - MathUtils.smoothstep(t, 0.69, 0.78))
    _upHint.copy(_earthUp).lerp(_moonUp, lunarBlend * ROCKET_FLIGHT_TUNING.moonUpBlend).normalize()
    _upHint.projectOnPlane(_forward).normalize()

    currentForward.current.lerp(_forward, alpha(ROCKET_FLIGHT_TUNING.orientationResponsiveness, delta)).normalize()
    currentUp.current.lerp(_upHint, alpha(ROCKET_FLIGHT_TUNING.orientationResponsiveness * 0.9, delta)).normalize()
    currentUp.current.projectOnPlane(currentForward.current).normalize()

    _turnAxis.crossVectors(currentForward.current, _forward)
    const signedTurn = _turnAxis.dot(currentUp.current)
    const speedFactor = MathUtils.clamp(currentVel.current.length() * 0.04, 0, 1)
    const bankTarget = MathUtils.clamp(
      -signedTurn * ROCKET_FLIGHT_TUNING.bankStrength * (0.5 + speedFactor),
      -ROCKET_FLIGHT_TUNING.bankClamp,
      ROCKET_FLIGHT_TUNING.bankClamp
    )

    currentBank.current = MathUtils.damp(
      currentBank.current,
      bankTarget,
      ROCKET_FLIGHT_TUNING.bankDamping,
      delta
    )

    buildQuaternion(currentForward.current, currentUp.current, currentBank.current)

    // Small additional nose-forward pitch that scales with acceleration:
    // reads as "leaning into travel" — most visible during ascent bursts.
    const accelMag = currentAcc.current.length()
    if (accelMag > 1e-4) {
      const pitchAmt = MathUtils.clamp(accelMag * ROCKET_FLIGHT_TUNING.accelPitchGain,
        0, ROCKET_FLIGHT_TUNING.accelPitchClamp)
      _pitchAxis.crossVectors(currentForward.current, currentUp.current).normalize()
      if (_pitchAxis.lengthSq() > 1e-6) {
        _pitchQuat.setFromAxisAngle(_pitchAxis, pitchAmt)
        _targetQuat.multiply(_pitchQuat)
      }
    }

    if (t < 0.08) {
      const launchBlend = MathUtils.smoothstep(t, 0.012, 0.08)
      currentQuat.current.copy(SURFACE_QUAT).slerp(_targetQuat, launchBlend)
    } else {
      currentQuat.current.slerp(_targetQuat, alpha(ROCKET_FLIGHT_TUNING.orientationResponsiveness, delta))
    }

    groupRef.current.quaternion.copy(currentQuat.current)

    flightRef.current.position.copy(currentPos.current)
    flightRef.current.velocity.copy(currentVel.current)
    flightRef.current.acceleration.copy(currentAcc.current)
    flightRef.current.forward.copy(currentForward.current)
    flightRef.current.up.copy(currentUp.current)
    flightRef.current.bank = currentBank.current
    flightRef.current.speed = currentVel.current.length()
  })
}
