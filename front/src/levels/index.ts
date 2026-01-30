/**
 * 根据 key 获取关卡
 * @param allLevels
 * @param levelKey
 */
export const getLevelByKey = (allLevels: any[], levelKey: string) => {
  return (
    allLevels.find((level) => {
      return level.key === levelKey;
    }) || allLevels[0]
  );
};

/**
 * 获取当前关卡位置
 * @param allLevels
 * @param currentLevel
 */
export const getCurrentLevelNum = (allLevels: any[], currentLevel: any) => {
  return allLevels.findIndex(
    (level: any) => level.key === currentLevel.key
  );
};

/**
 * 上一关
 *
 * @param allLevels
 * @param currentLevel
 */
export const getPrevLevel = (allLevels: any[], currentLevel: any) => {
  const num = getCurrentLevelNum(allLevels, currentLevel);
  if (num <= 0) {
    return;
  }
  return allLevels[num - 1];
};

/**
 * 下一关
 *
 * @param allLevels
 * @param currentLevel
 */
export const getNextLevel = (allLevels: any[], currentLevel: any) => {
  const num = getCurrentLevelNum(allLevels, currentLevel);
  if (num >= allLevels.length - 1) {
    return;
  }
  return allLevels[num + 1];
};
