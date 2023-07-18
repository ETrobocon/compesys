const STATE = {
    UNDEFINDED: 0,  // 未定義
    READY: 1,       // スタート前
    RUNNING: 2,     // 走行中
    PASSING: 3,     // LAP通過
    GOAL: 4,        // ゴール
}

const TEMP_DIR = '/tmp/etrobo'

module.exports = {
    STATE: STATE,
    TEMP_DIR: TEMP_DIR,
}