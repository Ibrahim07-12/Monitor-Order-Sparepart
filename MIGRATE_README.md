Migration steps (Windows PowerShell)

1. Create a Firebase service account JSON with appropriate permissions (Firestore Admin) and download it to your machine.
2. Open PowerShell in the project root.
3. Set the environment variable (temporary for the session):

$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccount.json"

4. Backup current spareparts:

node .\scripts\backup_spareparts.js

5. Run migration to set missing `plant` to "Foundry":

node .\scripts\migrate_add_plant.js

6. Verify results: open Admin view (Foundry) and Operator view (select Foundry). If anything looks wrong, restore from the JSON backup manually.

Notes:

- Always run backups before migrating production data.
- You can edit `scripts/migrate_add_plant.js` to change DEFAULT_PLANT if needed.
