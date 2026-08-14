function normalizeValue(value) {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s()-]/g, '') : ''
}

export function findPossibleMemberMatches(members = [], consultation) {
  const consultationName = normalizeValue(consultation?.name)
  const consultationContact = normalizeValue(consultation?.contact)
  if (!consultationName && !consultationContact) return []

  return members.filter((member) => {
    const memberName = normalizeValue(member.name)
    const memberContact = normalizeValue(member.phone)
    const sameContact = Boolean(consultationContact && memberContact && consultationContact === memberContact)
    const sameNameAndContact = Boolean(
      consultationName
      && consultationContact
      && memberName === consultationName
      && memberContact === consultationContact,
    )

    return sameContact || sameNameAndContact
  })
}
