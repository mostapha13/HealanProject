# Restore Drill
1. Restore backups into isolated databases, never over production first.
2. Run `RESTORE VERIFYONLY` and `DBCC CHECKDB`.
3. Start an isolated TSEAI stack against restored DBs.
4. Verify Identity login, saved filters, alerts, knowledge retrieval and chat.
5. Record RTO/RPO and drill date in operations log.
