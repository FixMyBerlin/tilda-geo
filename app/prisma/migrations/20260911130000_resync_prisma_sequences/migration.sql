-- Resync prisma.QaEvaluation_id_seq to MAX(id).
-- STG sequence fell behind MAX(id) after rows were copied with explicit ids
-- outside the app, so autoincrement inserts failed with P2002 on "id".
-- Idempotent: only moves the sequence forward, never backwards.
DO $$
DECLARE
  seq text := pg_get_serial_sequence('prisma."QaEvaluation"', 'id');
  max_id bigint;
  last_id bigint;
BEGIN
  IF seq IS NULL THEN
    RAISE EXCEPTION 'No serial sequence for prisma.QaEvaluation.id';
  END IF;
  SELECT MAX(id) INTO max_id FROM prisma."QaEvaluation";
  EXECUTE format('SELECT last_value FROM %s', seq) INTO last_id;
  IF max_id IS NOT NULL AND max_id > last_id THEN
    RAISE NOTICE 'Resync % from % to %', seq, last_id, max_id;
    PERFORM setval(seq, max_id, true);
  END IF;
END $$;
