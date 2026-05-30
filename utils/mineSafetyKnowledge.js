/**
 * Offline safety assistant replies when Gemini API is unavailable.
 */

const REPLIES = [
  {
    keys: ['shift handover', 'handover', 'shift change'],
    text: `**Shift handover checklist**
• Confirm all personnel accounted for and fit for duty
• Review open hazards, gas readings, and ventilation status
• Hand over active permits, lockout/tagout status, and equipment faults
• Note incidents, near-misses, and follow-up actions from previous shift
• Verify communication channels and emergency contact list
• Sign the digital handover log in Mine Manager before leaving site`,
  },
  {
    keys: ['gas detection', 'gas leak', 'methane', 'co gas'],
    text: `**Gas detection underground**
• Test atmosphere before entry and continuously during work
• Know alarm thresholds for methane (typically 1.25% warning, 2% withdrawal)
• Never override gas monitors; evacuate if readings rise or ventilation fails
• Use approved detectors calibrated per site schedule
• Report anomalies immediately via Safety Reports or SOS Emergency`,
  },
  {
    keys: ['report', 'incident', 'safety report'],
    text: `**Reporting a safety incident**
1. Ensure area is safe and notify shift incharge
2. Open **Safety Reports** → Create report
3. Include location, time, risk level, description, and photos if available
4. For life-threatening events use **Emergency → SOS** first
5. Managers review and approve reports in the Safety Reports list`,
  },
  {
    keys: ['ppe', 'protective equipment', 'helmet', 'harness'],
    text: `**PPE at the coal face**
• Hard hat, safety boots, high-visibility clothing
• Eye/face protection where dust or flying debris present
• Hearing protection in high-noise zones
• Respiratory protection per dust/gas assessment
• Fall protection and harness where working at height
• Inspect PPE before each shift; replace damaged items`,
  },
  {
    keys: ['emergency', 'sos', 'evacuation'],
    text: `**Emergency response**
• Trigger **Emergency → SOS** for fire, gas, collapse, or entrapment
• Follow muster point and evacuation routes for your section
• Do not re-enter until authorized by safety manager
• Use attendance and alerts pages to confirm team status`,
  },
  {
    keys: ['compliance', 'audit', 'regulation'],
    text: `**Compliance**
• Inspectors and managers maintain **Compliance Reports** with approval status
• Keep shift logs and safety plans up to date for audits
• Admins can review **Audit Logs** for system activity`,
  },
  {
    keys: ['coal mine', 'coal mines', 'mine site', 'underground mine', 'mining operation'],
    text: `**Coal mine operations (overview)**
• **Coal Mines** in Mine Manager lists sites with status, location, and production context
• Each mine has shift logs, attendance, safety plans, and compliance tied to that site
• Underground work needs ventilation planning, roof control, dust suppression, and gas monitoring
• Supervisors use **Dashboard** for alerts, maintenance tasks, and emergency status per mine
• Workers report hazards via **Safety Reports**; managers approve and track closure
• For site-specific geology, production targets, and DGMS rules, follow your mine’s safety plan and shift incharge`,
  },
  {
    keys: ['training', 'course', 'certification'],
    text: `**Training**
• Open **Training** to enroll in safety courses and track progress
• Complete mandatory modules before operating restricted equipment
• Points and leaderboard reflect completed training`,
  },
];

export function getOfflineSafetyReply(message, language) {
  const m = (message || '').toLowerCase();
  let text =
    REPLIES.find((r) => r.keys.some((k) => m.includes(k)))?.text ||
    `I can help with shift handover, gas safety, incident reporting, PPE, emergencies, compliance, and training. Try a suggested question above, or ask your safety manager for site-specific procedures.`;

  if (language && language !== 'en') {
    text += `\n\n_(Built-in help is in English. When Gemini quota is available, full AI replies can use ${language}.)_`;
  }
  return text;
}

export default { getOfflineSafetyReply };
