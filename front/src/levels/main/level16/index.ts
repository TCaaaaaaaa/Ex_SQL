import md from "./README.md?raw";
import sql from "./createTable.sql?raw";

export default {
  key: "level16",
  title: "函数 - 聚合函数",
  initSQL: sql,
  content: md,
  defaultSQL: "select * from student",
  answer: "select sum(score) as total_score, avg(score) as avg_score, max(score) as max_score, min(score) as min_score from student",
  hint: "请仔细查看本关给出的示例",
  type: "main",
} as LevelType;
