/**
 * 知识点数据种子脚本
 * 执行: node server/database/seeds/seed-knowledge.js
 */

const knowledgePoints = [
  // 七年级上册 - 第1章 有理数
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '正数和负数' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '有理数' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '数轴' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '相反数' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '绝对值' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '有理数的大小比较' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '有理数的加法' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '有理数的减法' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '有理数的乘法' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '有理数的除法' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '乘方' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第1章', name: '科学记数法' },

  // 七年级上册 - 第2章 整式的加减
  { version: '人教版', subject: '数学', chapter: '七年级上册第2章', name: '用字母表示数' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第2章', name: '单项式' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第2章', name: '多项式' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第2章', name: '整式' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第2章', name: '同类项' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第2章', name: '合并同类项' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第2章', name: '去括号' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第2章', name: '整式的加减' },

  // 七年级上册 - 第3章 一元一次方程
  { version: '人教版', subject: '数学', chapter: '七年级上册第3章', name: '一元一次方程' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第3章', name: '等式的性质' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第3章', name: '解一元一次方程(一)' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第3章', name: '解一元一次方程(二)' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第3章', name: '解一元一次方程(三)' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第3章', name: '实际问题与一元一次方程' },

  // 七年级上册 - 第4章 几何图形初步
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '立体图形与平面图形' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '从不同方向看立体图形' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '立体图形的展开图' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '点、线、面、体' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '直线、射线、线段' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '直线公理' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '线段的大小比较' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '线段的和差' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '线段的中点' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '两点之间线段最短' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '两点的距离' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '角' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '角的度量' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '角的比较与运算' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '角的平分线' },
  { version: '人教版', subject: '数学', chapter: '七年级上册第4章', name: '余角和补角' },

  // 七年级下册 - 第5章 相交线与平行线
  { version: '人教版', subject: '数学', chapter: '七年级下册第5章', name: '相交线' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第5章', name: '对顶角相等' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第5章', name: '垂线' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第5章', name: '垂线段最短' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第5章', name: '点到直线的距离' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第5章', name: '同位角、内错角、同旁内角' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第5章', name: '平行线' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第5章', name: '平行线的判定' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第5章', name: '平行线的性质' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第5章', name: '命题、定理、证明' },

  // 七年级下册 - 第6章 实数
  { version: '人教版', subject: '数学', chapter: '七年级下册第6章', name: '算术平方根' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第6章', name: '平方根' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第6章', name: '开平方' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第6章', name: '立方根' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第6章', name: '开立方' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第6章', name: '无理数' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第6章', name: '实数' },

  // 七年级下册 - 第7章 平面直角坐标系
  { version: '人教版', subject: '数学', chapter: '七年级下册第7章', name: '有序数对' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第7章', name: '平面直角坐标系' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第7章', name: '点的坐标' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第7章', name: '象限' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第7章', name: '坐标轴上的点' },

  // 七年级下册 - 第8章 二元一次方程组
  { version: '人教版', subject: '数学', chapter: '七年级下册第8章', name: '二元一次方程' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第8章', name: '二元一次方程组' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第8章', name: '二元一次方程的解' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第8章', name: '代入消元法' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第8章', name: '加减消元法' },

  // 七年级下册 - 第9章 不等式与不等式组
  { version: '人教版', subject: '数学', chapter: '七年级下册第9章', name: '不等式' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第9章', name: '不等式的解集' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第9章', name: '不等式的性质' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第9章', name: '一元一次不等式' },
  { version: '人教版', subject: '数学', chapter: '七年级下册第9章', name: '一元一次不等式组' },

  // 八年级上册 - 第11章 三角形
  { version: '人教版', subject: '数学', chapter: '八年级上册第11章', name: '三角形的边' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第11章', name: '三角形的高、中线、角平分线' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第11章', name: '三角形的稳定性' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第11章', name: '三角形的内角' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第11章', name: '直角三角形的性质' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第11章', name: '三角形的外角' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第11章', name: '多边形的内角和' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第11章', name: '多边形的外角和' },

  // 八年级上册 - 第12章 全等三角形
  { version: '人教版', subject: '数学', chapter: '八年级上册第12章', name: '全等三角形' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第12章', name: '边边边(SSS)' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第12章', name: '边角边(SAS)' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第12章', name: '角边角(ASA)' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第12章', name: '角角边(AAS)' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第12章', name: '斜边直角边(HL)' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第12章', name: '角的平分线的性质' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第12章', name: '角的平分线的判定' },

  // 八年级上册 - 第13章 轴对称
  { version: '人教版', subject: '数学', chapter: '八年级上册第13章', name: '轴对称图形' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第13章', name: '轴对称' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第13章', name: '线段的垂直平分线' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第13章', name: '等腰三角形' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第13章', name: '等腰三角形的判定' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第13章', name: '等边三角形' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第13章', name: '含30°角的直角三角形' },

  // 八年级上册 - 第14章 整式的乘法与因式分解
  { version: '人教版', subject: '数学', chapter: '八年级上册第14章', name: '同底数幂的乘法' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第14章', name: '幂的乘方' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第14章', name: '积的乘方' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第14章', name: '单项式乘单项式' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第14章', name: '单项式乘多项式' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第14章', name: '多项式乘多项式' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第14章', name: '平方差公式' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第14章', name: '完全平方公式' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第14章', name: '因式分解' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第14章', name: '提公因式法' },
  { version: '人教版', subject: '数学', chapter: '八年级上册第14章', name: '公式法' },

  // 八年级下册 - 第16章 二次根式
  { version: '人教版', subject: '数学', chapter: '八年级下册第16章', name: '二次根式' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第16章', name: '二次根式的性质' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第16章', name: '最简二次根式' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第16章', name: '二次根式的乘除' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第16章', name: '二次根式的加减' },

  // 八年级下册 - 第17章 勾股定理
  { version: '人教版', subject: '数学', chapter: '八年级下册第17章', name: '勾股定理' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第17章', name: '勾股定理的逆定理' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第17章', name: '勾股数' },

  // 八年级下册 - 第18章 平行四边形
  { version: '人教版', subject: '数学', chapter: '八年级下册第18章', name: '平行四边形' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第18章', name: '平行四边形的性质' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第18章', name: '平行四边形的判定' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第18章', name: '三角形的中位线' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第18章', name: '矩形' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第18章', name: '菱形' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第18章', name: '正方形' },

  // 八年级下册 - 第19章 一次函数
  { version: '人教版', subject: '数学', chapter: '八年级下册第19章', name: '常量与变量' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第19章', name: '函数' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第19章', name: '函数图象' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第19章', name: '正比例函数' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第19章', name: '一次函数' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第19章', name: '一次函数的图象' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第19章', name: '一次函数的性质' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第19章', name: '待定系数法' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第19章', name: '一次函数与方程' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第19章', name: '一次函数与不等式' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第19章', name: '一次函数与二元一次方程组' },

  // 八年级下册 - 第20章 数据的分析
  { version: '人教版', subject: '数学', chapter: '八年级下册第20章', name: '平均数' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第20章', name: '加权平均数' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第20章', name: '中位数' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第20章', name: '众数' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第20章', name: '方差' },
  { version: '人教版', subject: '数学', chapter: '八年级下册第20章', name: '极差' },

  // 九年级上册 - 第21章 一元二次方程
  { version: '人教版', subject: '数学', chapter: '九年级上册第21章', name: '一元二次方程' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第21章', name: '一元二次方程的根' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第21章', name: '直接开平方法' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第21章', name: '配方法' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第21章', name: '公式法' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第21章', name: '根的判别式' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第21章', name: '因式分解法' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第21章', name: '根与系数的关系' },

  // 九年级上册 - 第22章 二次函数
  { version: '人教版', subject: '数学', chapter: '九年级上册第22章', name: '二次函数' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第22章', name: '二次函数y=ax²的图象' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第22章', name: '二次函数y=a(x-h)²+k的图象' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第22章', name: '二次函数y=ax²+bx+c的图象' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第22章', name: '用待定系数法求二次函数解析式' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第22章', name: '二次函数与一元二次方程' },

  // 九年级上册 - 第23章 旋转
  { version: '人教版', subject: '数学', chapter: '九年级上册第23章', name: '旋转' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第23章', name: '旋转的性质' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第23章', name: '中心对称' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第23章', name: '中心对称图形' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第23章', name: '关于原点对称的点的坐标' },

  // 九年级上册 - 第24章 圆
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '圆' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '垂直于弦的直径' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '弧、弦、圆心角' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '圆周角' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '点和圆的位置关系' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '直线和圆的位置关系' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '切线的判定' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '切线的性质' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '切线长定理' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '三角形的外接圆' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '三角形的内切圆' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '正多边形和圆' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '弧长' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '扇形面积' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第24章', name: '圆锥的侧面积' },

  // 九年级上册 - 第25章 概率初步
  { version: '人教版', subject: '数学', chapter: '九年级上册第25章', name: '随机事件' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第25章', name: '概率' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第25章', name: '用列举法求概率' },
  { version: '人教版', subject: '数学', chapter: '九年级上册第25章', name: '用频率估计概率' },

  // 九年级下册 - 第26章 反比例函数
  { version: '人教版', subject: '数学', chapter: '九年级下册第26章', name: '反比例函数' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第26章', name: '反比例函数的图象' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第26章', name: '反比例函数的性质' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第26章', name: 'k的几何意义' },

  // 九年级下册 - 第27章 相似
  { version: '人教版', subject: '数学', chapter: '九年级下册第27章', name: '相似图形' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第27章', name: '相似多边形' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第27章', name: '相似三角形的判定' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第27章', name: '相似三角形的性质' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第27章', name: '位似' },

  // 九年级下册 - 第28章 锐角三角函数
  { version: '人教版', subject: '数学', chapter: '九年级下册第28章', name: '正弦' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第28章', name: '余弦' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第28章', name: '正切' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第28章', name: '特殊角的三角函数值' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第28章', name: '解直角三角形' },

  // 九年级下册 - 第29章 投影与视图
  { version: '人教版', subject: '数学', chapter: '九年级下册第29章', name: '平行投影' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第29章', name: '中心投影' },
  { version: '人教版', subject: '数学', chapter: '九年级下册第29章', name: '三视图' },
];

// 生成 SQL INSERT 语句
console.log('INSERT INTO knowledge_point (id, version, subject, chapter, name, content) VALUES');
const values = knowledgePoints.map((kp, idx) => {
  const content = JSON.stringify({
    coreKnowledge: `${kp.name}的核心知识`,
    solutionMethods: `${kp.name}的解题方法`,
    commonMistakes: `${kp.name}的常见错误`
  });
  const isLast = idx === knowledgePoints.length - 1;
  return `  (gen_random_uuid(), '${kp.version}', '${kp.subject}', '${kp.chapter}', '${kp.name}', '${content}'::jsonb)${isLast ? ';' : ','}`;
});
console.log(values.join('\n'));
