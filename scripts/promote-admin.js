// Le da el rol de admin a un usuario que ya existe (por ejemplo, uno creado
// automáticamente al iniciar sesión con Google) sin tocar nada a mano en el dashboard.
// Uso: npm run promote-admin -- correo@ejemplo.com
const { createClient } = require('@supabase/supabase-js');

const [, , email] = process.argv;

if (!email) {
  console.error('Uso: npm run promote-admin -- correo@ejemplo.com');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env.');
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceRoleKey);

async function findUserByEmail(targetEmail) {
  const perPage = 200;
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null; // última página
  }
}

async function main() {
  const user = await findUserByEmail(email);

  if (!user) {
    console.error(`No encontramos ningún usuario con el email ${email}.`);
    console.error('Iniciá sesión al menos una vez (con Google o email/contraseña) antes de promoverlo.');
    process.exit(1);
  }

  if (user.app_metadata?.role === 'admin') {
    console.log(`${email} ya tiene el rol de admin.`);
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: 'admin' },
  });

  if (error) {
    console.error('No se pudo actualizar el usuario:', error.message);
    process.exit(1);
  }

  console.log(`Listo: ${data.user.email} ahora tiene rol de admin (id: ${data.user.id}).`);
  console.log('Ya puede entrar a /admin con esa cuenta.');
}

main();
