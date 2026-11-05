import 'dotenv/config';
import { mysqlDb } from './mysql.ts';

async function runInitAdmin(): Promise<void> {
  const fullName = String(process.env.ADMIN_NAME || 'سهراب رستگار').trim();
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0] || 'مدیر';
  const lastName = nameParts.slice(1).join(' ') || 'باشگاه';
  const username = String(process.env.ADMIN_USERNAME || 'admin').trim();
  const email = String(process.env.ADMIN_EMAIL || 'admin@bookmeet.ir').trim();
  const passwordPlain = String(process.env.ADMIN_PASSWORD || '').trim();

  if (
    !passwordPlain ||
    passwordPlain.length < 8 ||
    ['CHANGE_THIS_TO_A_STRONG_PASSWORD', 'admin1234', '1234', 'admin'].includes(
      passwordPlain
    )
  ) {
    console.error(
      '❌ خطا: لطفاً در فایل .env مقدار ADMIN_PASSWORD را با یک رمز عبور قوی (حداقل ۸ کاراکتر) تنظیم نمایید.'
    );
    process.exit(1);
  }

  try {
    await mysqlDb.initializeDatabase();
    const [existing] = await mysqlDb
      .getPool()
      .execute("SELECT id, phone, email FROM club_members WHERE role = 'admin' LIMIT 1");
    const rows = existing as Array<{ id: number; phone: string; email: string }>;

    if (rows.length > 0) {
      console.log(
        `✅ حساب مدیر اولیه از قبل در دیتابیس وجود دارد (شناسه ورود: ${rows[0].phone} · ایمیل: ${rows[0].email}).`
      );
      process.exit(0);
    }

    const created = await mysqlDb.initializeSingleAdminAccount({
      firstName,
      lastName,
      username,
      email,
      passwordPlain,
    });

    console.log('✅ حساب مدیر اولیه با موفقیت در MySQL ایجاد شد:');
    console.log(`   نام: ${created.first_name} ${created.last_name}`);
    console.log(`   نام کاربری / شماره ورود: ${created.phone}`);
    console.log(`   ایمیل: ${created.email}`);
    process.exit(0);
  } catch (error) {
    console.error(
      '❌ خطا در ایجاد حساب مدیر در MySQL:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

runInitAdmin();
