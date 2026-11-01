CREATE TABLE IF NOT EXISTS comments (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
 comment text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS comment_limits (key text PRIMARY KEY,last_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS visits (
 day date NOT NULL,
 visitor text NOT NULL,
 device text NOT NULL,
 views bigint NOT NULL DEFAULT 1,
 PRIMARY KEY(day,visitor,device)
);
-- Manutenzione facoltativa: elimina le chiavi antispam scadute.
-- DELETE FROM comment_limits WHERE last_at < now()-interval '2 days';
-- Per eliminare un commento: DELETE FROM comments WHERE id = ID_DA_ELIMINARE;
