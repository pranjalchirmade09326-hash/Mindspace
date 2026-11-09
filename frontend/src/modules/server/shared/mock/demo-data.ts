import type { TAppointmentResponse } from "@/modules/entities/schemas/appointment";

export function getDemoAppointments(): TAppointmentResponse[] {
  const now = new Date();
  const makeDate = (hours: number, minutes = 0, dayOffset = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 101,
      user_id: "usr-patient-01",
      org_id: "org-default-01",
      status: "booked",
      start: makeDate(10, 0),
      end: makeDate(10, 30),
      minutes_duration: 30,
      description: "Hypertension Routine Follow-up & BP Monitoring",
      created: makeDate(8, 0, -2),
      subject_type: "Patient",
      subject_id: 1,
      subject_display: "Sarah Jenkins",
      participant: [
        {
          id: 1,
          reference_type: "Patient",
          reference_id: 1,
          reference_display: "Sarah Jenkins",
          status: "accepted",
        },
        {
          id: 2,
          reference_type: "Practitioner",
          reference_id: 1,
          reference_display: "Dr. John Smith",
          status: "accepted",
        },
      ],
    } as unknown as TAppointmentResponse,
    {
      id: 102,
      user_id: "usr-patient-02",
      org_id: "org-default-01",
      status: "booked",
      start: makeDate(11, 30),
      end: makeDate(12, 0),
      minutes_duration: 30,
      description: "Type 2 Diabetes Mellitus Quarterly Review",
      created: makeDate(9, 15, -1),
      subject_type: "Patient",
      subject_id: 2,
      subject_display: "Rahul Sharma",
      participant: [
        {
          id: 3,
          reference_type: "Patient",
          reference_id: 2,
          reference_display: "Rahul Sharma",
          status: "accepted",
        },
        {
          id: 4,
          reference_type: "Practitioner",
          reference_id: 1,
          reference_display: "Dr. John Smith",
          status: "accepted",
        },
      ],
    } as unknown as TAppointmentResponse,
    {
      id: 103,
      user_id: "usr-patient-03",
      org_id: "org-default-01",
      status: "fulfilled",
      start: makeDate(9, 0),
      end: makeDate(9, 30),
      minutes_duration: 30,
      description: "Acute Bronchitis & Cough Assessment",
      created: makeDate(14, 0, -3),
      subject_type: "Patient",
      subject_id: 3,
      subject_display: "Priya Desai",
      participant: [
        {
          id: 5,
          reference_type: "Patient",
          reference_id: 3,
          reference_display: "Priya Desai",
          status: "accepted",
        },
        {
          id: 6,
          reference_type: "Practitioner",
          reference_id: 1,
          reference_display: "Dr. John Smith",
          status: "accepted",
        },
      ],
    } as unknown as TAppointmentResponse,
    {
      id: 104,
      user_id: "usr-patient-04",
      org_id: "org-default-01",
      status: "pending",
      start: makeDate(14, 30),
      end: makeDate(15, 0),
      minutes_duration: 30,
      description: "Cardiology Review & ECG Follow-up",
      created: makeDate(10, 0, -1),
      subject_type: "Patient",
      subject_id: 4,
      subject_display: "Vikram Patel",
      participant: [
        {
          id: 7,
          reference_type: "Patient",
          reference_id: 4,
          reference_display: "Vikram Patel",
          status: "needs-action",
        },
        {
          id: 8,
          reference_type: "Practitioner",
          reference_id: 1,
          reference_display: "Dr. John Smith",
          status: "accepted",
        },
      ],
    } as unknown as TAppointmentResponse,
    {
      id: 105,
      user_id: "usr-patient-05",
      org_id: "org-default-01",
      status: "booked",
      start: makeDate(16, 0),
      end: makeDate(16, 30),
      minutes_duration: 30,
      description: "Dermatology Rash & Skin Allergy Teleconsult",
      created: makeDate(11, 0, -2),
      subject_type: "Patient",
      subject_id: 5,
      subject_display: "Anita Verma",
      participant: [
        {
          id: 9,
          reference_type: "Patient",
          reference_id: 5,
          reference_display: "Anita Verma",
          status: "accepted",
        },
        {
          id: 10,
          reference_type: "Practitioner",
          reference_id: 1,
          reference_display: "Dr. John Smith",
          status: "accepted",
        },
      ],
    } as unknown as TAppointmentResponse,
  ];
}
