import {
  COMPANION_PROFILES,
  DEFAULT_COMPANION_PROFILE_ID,
  type CompanionProfileId,
} from '@codexpet/core';

const BUILD_COMPANION_PROFILE_ID = import.meta.env.VITE_COMPANION_PROFILE_ID;

export function getBuildCompanionProfileId(): CompanionProfileId {
  return isCompanionProfileId(BUILD_COMPANION_PROFILE_ID)
    ? BUILD_COMPANION_PROFILE_ID
    : DEFAULT_COMPANION_PROFILE_ID;
}

function isCompanionProfileId(value: unknown): value is CompanionProfileId {
  return typeof value === 'string' && value in COMPANION_PROFILES;
}
