
export enum KnowledgePoint {
  BASIC_SELECT = 'BASIC_SELECT', // 基础查询
  COLUMN_ALIAS = 'COLUMN_ALIAS', // 列别名
  WHERE_CLAUSE = 'WHERE_CLAUSE', // 条件查询
  OPERATORS = 'OPERATORS', // 运算符
  LIKE_MATCH = 'LIKE_MATCH', // 模糊查询
  NULL_HANDLE = 'NULL_HANDLE', // 空值处理
  ORDER_BY = 'ORDER_BY', // 排序
  LIMIT_OFFSET = 'LIMIT_OFFSET', // 分页
  AGGREGATION = 'AGGREGATION', // 聚合函数
  GROUP_BY = 'GROUP_BY', // 分组
  HAVING_CLAUSE = 'HAVING_CLAUSE', // 分组筛选
  DISTINCT = 'DISTINCT', // 去重
  MULTI_TABLE = 'MULTI_TABLE', // 多表查询
  JOIN_INNER = 'JOIN_INNER', // 内连接
  JOIN_LEFT = 'JOIN_LEFT', // 左连接
  SUBQUERY = 'SUBQUERY', // 子查询
  UNION = 'UNION', // 组合查询
  FUNCTIONS = 'FUNCTIONS', // 常用函数
}

export const KnowledgePointLabels: Record<KnowledgePoint, string> = {
  [KnowledgePoint.BASIC_SELECT]: '基础查询',
  [KnowledgePoint.COLUMN_ALIAS]: '列别名',
  [KnowledgePoint.WHERE_CLAUSE]: '条件查询',
  [KnowledgePoint.OPERATORS]: '运算符',
  [KnowledgePoint.LIKE_MATCH]: '模糊查询',
  [KnowledgePoint.NULL_HANDLE]: '空值处理',
  [KnowledgePoint.ORDER_BY]: '排序',
  [KnowledgePoint.LIMIT_OFFSET]: '分页',
  [KnowledgePoint.AGGREGATION]: '聚合函数',
  [KnowledgePoint.GROUP_BY]: '分组',
  [KnowledgePoint.HAVING_CLAUSE]: '分组筛选',
  [KnowledgePoint.DISTINCT]: '去重',
  [KnowledgePoint.MULTI_TABLE]: '多表查询',
  [KnowledgePoint.JOIN_INNER]: '内连接',
  [KnowledgePoint.JOIN_LEFT]: '左连接',
  [KnowledgePoint.SUBQUERY]: '子查询',
  [KnowledgePoint.UNION]: '组合查询',
  [KnowledgePoint.FUNCTIONS]: '常用函数',
};

export function getKnowledgeLabel(kp: KnowledgePoint | string): string {
  const label = KnowledgePointLabels[kp as KnowledgePoint];
  return label ? `${label} (${kp})` : kp;
}

// 关卡到知识点的映射 (根据题目内容推断)
export const LevelKnowledgeMap: Record<string, KnowledgePoint[]> = {
  'level1': [KnowledgePoint.BASIC_SELECT],
  'level2': [KnowledgePoint.BASIC_SELECT, KnowledgePoint.COLUMN_ALIAS],
  'level3': [KnowledgePoint.WHERE_CLAUSE],
  'level4': [KnowledgePoint.WHERE_CLAUSE, KnowledgePoint.OPERATORS],
  'level5': [KnowledgePoint.WHERE_CLAUSE, KnowledgePoint.LIKE_MATCH],
  'level6': [KnowledgePoint.NULL_HANDLE],
  'level7': [KnowledgePoint.WHERE_CLAUSE, KnowledgePoint.OPERATORS], // 多条件
  'level8': [KnowledgePoint.ORDER_BY],
  'level9': [KnowledgePoint.LIMIT_OFFSET],
  'level10': [KnowledgePoint.AGGREGATION],
  'level11': [KnowledgePoint.GROUP_BY, KnowledgePoint.AGGREGATION],
  'level12': [KnowledgePoint.GROUP_BY, KnowledgePoint.HAVING_CLAUSE],
  'level13': [KnowledgePoint.DISTINCT],
  'level14': [KnowledgePoint.FUNCTIONS], // 字符串函数
  'level15': [KnowledgePoint.FUNCTIONS], // 时间函数
  'level16': [KnowledgePoint.FUNCTIONS], // 数值函数
  'level17': [KnowledgePoint.FUNCTIONS], // 条件函数
  'level18': [KnowledgePoint.MULTI_TABLE],
  'level19': [KnowledgePoint.JOIN_INNER],
  'level20': [KnowledgePoint.JOIN_LEFT],
  'level21': [KnowledgePoint.MULTI_TABLE, KnowledgePoint.JOIN_INNER], // 复杂连接
  'level22': [KnowledgePoint.SUBQUERY],
  'level23': [KnowledgePoint.SUBQUERY], // 关联子查询
  'level24': [KnowledgePoint.UNION],
  'level25': [KnowledgePoint.WHERE_CLAUSE], // 综合复习
  'level26': [KnowledgePoint.GROUP_BY], // 综合复习
  'level27': [KnowledgePoint.JOIN_INNER], // 综合复习
  'level28': [KnowledgePoint.SUBQUERY], // 综合复习
  'level29': [KnowledgePoint.FUNCTIONS], // 综合复习
  'level30': [KnowledgePoint.MULTI_TABLE], // 最终挑战
};

// 知识点前置依赖关系 (用于负域分解策略)
// Key: 当前知识点, Value: 前置知识点 (如果当前不会，应该去学哪个)
export const KnowledgeDependency: Record<string, KnowledgePoint> = {
  [KnowledgePoint.WHERE_CLAUSE]: KnowledgePoint.BASIC_SELECT,
  [KnowledgePoint.ORDER_BY]: KnowledgePoint.WHERE_CLAUSE,
  [KnowledgePoint.AGGREGATION]: KnowledgePoint.BASIC_SELECT,
  [KnowledgePoint.GROUP_BY]: KnowledgePoint.AGGREGATION,
  [KnowledgePoint.HAVING_CLAUSE]: KnowledgePoint.GROUP_BY,
  [KnowledgePoint.JOIN_INNER]: KnowledgePoint.MULTI_TABLE,
  [KnowledgePoint.JOIN_LEFT]: KnowledgePoint.JOIN_INNER,
  [KnowledgePoint.SUBQUERY]: KnowledgePoint.WHERE_CLAUSE,
};
