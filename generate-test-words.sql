-- Create textbook
INSERT INTO textbooks (name, description, order_index, created_at, updated_at)
VALUES ('测试教材', '用于测试的教材', 0, NOW(), NOW());

-- Create unit
INSERT INTO units (textbook_id, name, order_index, created_at, updated_at)
VALUES (
  (SELECT id FROM textbooks WHERE name = '测试教材' ORDER BY created_at DESC LIMIT 1),
  '测试单元', 0, NOW(), NOW()
);

-- Generate 100 test words
DO $$
BEGIN
  FOR i IN 1..100 LOOP
    INSERT INTO words (unit_id, english, chinese, phonetic, part_of_speech, order_index, created_at, updated_at)
    VALUES (
      (SELECT id FROM units WHERE name = '测试单元' ORDER BY created_at DESC LIMIT 1),
      'Test Word ' || i,
      '测试单词 ' || i,
      '/test-word-' || i || '/',
      CASE WHEN i % 2 = 0 THEN 'n.' ELSE 'v.' END,
      i - 1,
      NOW(),
      NOW()
    );
  END LOOP;
END $$;

-- Verify the insertion
SELECT COUNT(*) FROM words WHERE unit_id = (SELECT id FROM units WHERE name = '测试单元' ORDER BY created_at DESC LIMIT 1);
