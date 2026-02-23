import md from "./README.md?raw";
import sql from "./createTable.sql?raw";

export default {
  key: "level18",
  title: "分组聚合 - 多字段分组",
  initSQL: sql,
  content: md,
  defaultSQL: "select * from student",
  answer: "select class_id, exam_num, count(*) as total_num from student group by class_id, exam_num;",
  hint: "请仔细查看本关给出的示例",
  type: "main",
} as LevelType;
