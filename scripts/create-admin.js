// Crea (o actualiza) el usuario administrador de Marli Libros.
// Uso: npm run create-admin -- correo@ejemplo.com "contraseña"
const { createClient } = require('@supabase/supabase-js');

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Uso: npm run create-admin -- correo@ejemplo.com "contraseña"');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env.');
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceRoleKey);

async function main() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'admin' },
  });

  if (error) {
    console.error('No se pudo crear el usuario admin:', error.message);
    process.exit(1);
  }

  console.log(`Usuario admin creado: ${data.user.email} (id: ${data.user.id})`);
  console.log('Ya podés iniciar sesión en /login con ese correo y contraseña.');
}

main();
