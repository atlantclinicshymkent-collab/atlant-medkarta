import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const form = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to match existing patient by phone
    let patientId = form.patientId || null;
    if (!patientId && form.phone) {
      const phone = form.phone.replace(/[\s\-\(\)]/g, '');
      const { data: patients } = await supabase
        .from('patients')
        .select('id')
        .or(`phone.eq.${phone},phone.eq.+${phone},phone.eq.${phone.replace('+', '')}`);
      if (patients && patients.length > 0) {
        patientId = patients[0].id;
      }
    }

    const row = {
      patient_id: patientId || null,
      last_name: form.lastName || '',
      first_name: form.firstName || '',
      patronymic: form.patronymic || '',
      dob: form.dob || null,
      phone: form.phone || '',
      zones: form.zones || [],
      complaints: form.complaints || '',
      pain_vas: form.painVas || 0,
      pain_duration: form.painDuration || '',
      pain_worse: form.painWorse || '',
      chronic_diseases: form.chronicDiseases || [],
      chronic_other: form.chronicOther || '',
      allergies: form.allergies || '',
      medications: form.medications || '',
      previous_treatment: form.previousTreatment || '',
      surgeries: form.surgeries || '',
      occupation: form.occupation || '',
      activity_level: form.activityLevel || '',
      expectations: form.expectations || '',
      consent: form.consent || false,
      doctor: form.doctor || '',
    };

    const { data, error } = await supabase
      .from('questionnaires')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('Questionnaire save error:', error);
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Questionnaire API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
