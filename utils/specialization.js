function formatSpecializationValue(specialization, specializationOther) {
  if (!specialization) return '';
  if (specialization === 'Other') return String(specializationOther || '').trim();
  return String(specialization).trim();
}

function resolveQualSectionSpecialization(section = {}) {
  if (section.specialization) {
    return formatSpecializationValue(section.specialization, section.specializationOther);
  }
  if (section.stream === 'Other' || section.stream === 'other') {
    return String(section.streamOther || '').trim();
  }
  return String(section.stream || '').trim();
}

exports.formatSpecializationValue = formatSpecializationValue;

exports.resolveCandidateSpecialization = (registrationData = {}, body = {}) => {
  if (body.specialization) {
    if (body.specialization === 'Other' || body.specialization === 'other') {
      const q = registrationData.highestQualification;
      if (q && registrationData[q] && registrationData[q].specializationOther) {
        return String(registrationData[q].specializationOther).trim();
      }
    }
    return String(body.specialization).trim();
  }

  const qualKey = registrationData.highestQualification;
  if (!qualKey || qualKey === 'other') return '';

  const section = registrationData[qualKey] || {};
  return resolveQualSectionSpecialization(section);
};

exports.resolveCandidateStream = (registrationData = {}, body = {}) => {
  if (body.stream) {
    if (body.stream === 'Other' || body.stream === 'other') {
      const q = registrationData.highestQualification;
      if (q && registrationData[q] && registrationData[q].streamOther) {
        return String(registrationData[q].streamOther).trim();
      }
    }
    return String(body.stream).trim();
  }

  const qualKey = registrationData.highestQualification;
  if (!qualKey || qualKey === 'other') return '';

  const section = registrationData[qualKey] || {};
  if (section.stream === 'Other' || section.stream === 'other') {
    return String(section.streamOther || '').trim();
  }
  return String(section.stream || '').trim();
};

exports.normalizeOpeningSpecialization = (opening = {}) => {
  const typedSpecialization = String(opening.specialization || '').trim();
  const specialization = formatSpecializationValue(
    opening.specialization,
    opening.specializationOther
  ) || typedSpecialization;

  return {
    ...opening,
    specialization,
    specializationOther: opening.specializationOther || '',
    stream: String(opening.stream || specialization || '').trim(),
  };
};
