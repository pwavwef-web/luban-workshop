const admin = require('firebase-admin');

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: npm run set-admin-claim -- <UID-or-email>');
    process.exit(1);
  }

  admin.initializeApp();

  let userRecord;
  if (target.includes('@')) {
    userRecord = await admin.auth().getUserByEmail(target);
  } else {
    userRecord = await admin.auth().getUser(target);
  }

  const currentClaims = userRecord.customClaims || {};
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    ...currentClaims,
    admin: true,
  });

  console.log(`Admin claim granted: uid=${userRecord.uid}, email=${userRecord.email || 'n/a'}`);
}

main().catch((error) => {
  console.error('Failed to set admin claim:', error?.message || error);
  process.exit(1);
});
