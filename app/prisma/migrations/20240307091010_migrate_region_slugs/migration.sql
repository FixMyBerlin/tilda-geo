UPDATE "Region"
SET slug = CASE slug
  WHEN 'bb-ag' THEN 'bb-pg'
  WHEN 'bb-ramboll' THEN 'bb-sg'
  ELSE slug
END;
