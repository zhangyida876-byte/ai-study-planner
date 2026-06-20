-- 七年级下册
INSERT INTO knowledge_point (id, version, subject, chapter, name, content) VALUES
-- 第五章 相交线与平行线
(gen_random_uuid(), '人教版', '数学', '七年级下册第5章', '相交线', '{"coreKnowledge": "理解相交线、邻补角、对顶角的概念", "solutionMethods": "两条直线相交形成四个角，相邻的角互为邻补角，相对的角互为对顶角", "commonMistakes": "邻补角与对顶角的概念混淆"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第5章', '对顶角相等', '{"coreKnowledge": "掌握对顶角相等的性质", "solutionMethods": "对顶角相等是几何证明中常用的结论", "commonMistakes": "证明过程不规范"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第5章', '垂线', '{"coreKnowledge": "理解垂线的概念和画法", "solutionMethods": "当两条直线相交所成的四个角中有一个角是直角时，两直线互相垂直", "commonMistakes": "垂线的表示方法错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第5章', '垂线段最短', '{"coreKnowledge": "掌握垂线段最短的性质", "solutionMethods": "连接直线外一点与直线上各点的所有线段中，垂线段最短", "commonMistakes": "应用时识别错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第5章', '点到直线的距离', '{"coreKnowledge": "理解点到直线距离的概念", "solutionMethods": "直线外一点到这条直线的垂线段的长度，叫做点到直线的距离", "commonMistakes": "距离是长度，不是垂线段本身"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第5章', '同位角、内错角、同旁内角', '{"coreKnowledge": "能识别同位角、内错角、同旁内角", "solutionMethods": "两条直线被第三条直线所截形成的八个角中，位置相同的一对角是同位角；在两条直线之间，分别在截线两侧的一对角是内错角；在两条直线之间，在截线同侧的一对角是同旁内角", "commonMistakes": "识别时找错截线和被截线"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第5章', '平行线', '{"coreKnowledge": "理解平行线的概念和平行公理", "solutionMethods": "在同一平面内，不相交的两条直线叫做平行线；过直线外一点有且只有一条直线与这条直线平行", "commonMistakes": "忽略在同一平面内的前提"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第5章', '平行线的判定', '{"coreKnowledge": "掌握平行线的判定方法", "solutionMethods": "同位角相等，两直线平行；内错角相等，两直线平行；同旁内角互补，两直线平行", "commonMistakes": "判定条件记混，证明过程不规范"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第5章', '平行线的性质', '{"coreKnowledge": "掌握平行线的性质", "solutionMethods": "两直线平行，同位角相等；两直线平行，内错角相等；两直线平行，同旁内角互补", "commonMistakes": "性质与判定混淆"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第5章', '命题、定理、证明', '{"coreKnowledge": "理解命题、定理、证明的概念", "solutionMethods": "命题由题设和结论组成，定理是经过推理证明的真命题", "commonMistakes": "不能准确找出命题的题设和结论"}'::jsonb),

-- 第六章 实数
(gen_random_uuid(), '人教版', '数学', '七年级下册第6章', '算术平方根', '{"coreKnowledge": "理解算术平方根的概念", "solutionMethods": "若一个正数x的平方等于a，则x叫做a的算术平方根，记作√a", "commonMistakes": "算术平方根与平方根混淆，符号表示错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第6章', '平方根', '{"coreKnowledge": "理解平方根的概念和性质", "solutionMethods": "若一个数的平方等于a，则这个数叫做a的平方根；正数有两个平方根，0的平方根是0，负数没有平方根", "commonMistakes": "忽略负数没有平方根，正数的平方根有两个"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第6章', '开平方', '{"coreKnowledge": "掌握开平方运算", "solutionMethods": "求一个数a的平方根的运算叫做开平方", "commonMistakes": "开平方与平方运算混淆"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第6章', '立方根', '{"coreKnowledge": "理解立方根的概念和性质", "solutionMethods": "若一个数的立方等于a，则这个数叫做a的立方根；任何数都有唯一的立方根", "commonMistakes": "立方根与平方根的性质混淆"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第6章', '开立方', '{"coreKnowledge": "掌握开立方运算", "solutionMethods": "求一个数a的立方根的运算叫做开立方", "commonMistakes": "开立方的符号判断错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第6章', '无理数', '{"coreKnowledge": "理解无理数的概念", "solutionMethods": "无限不循环小数叫做无理数，如√2、π等", "commonMistakes": "误认为带根号的数都是无理数"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第6章', '实数', '{"coreKnowledge": "理解实数的概念和分类", "solutionMethods": "有理数和无理数统称为实数；实数与数轴上的点一一对应", "commonMistakes": "实数的分类不完整"}'::jsonb),

-- 第七章 平面直角坐标系
(gen_random_uuid(), '人教版', '数学', '七年级下册第7章', '有序数对', '{"coreKnowledge": "理解有序数对的概念", "solutionMethods": "有顺序的两个数a与b组成的数对叫做有序数对，记作(a,b)", "commonMistakes": "有序数对中两个数的顺序不能交换"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第7章', '平面直角坐标系', '{"coreKnowledge": "理解平面直角坐标系的构成", "solutionMethods": "由两条互相垂直、原点重合的数轴组成，水平的叫x轴，竖直的叫y轴", "commonMistakes": "坐标轴方向记错"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第7章', '点的坐标', '{"coreKnowledge": "会求点的坐标，能根据坐标描点", "solutionMethods": "过点向x轴、y轴作垂线，垂足对应的数分别是横坐标、纵坐标", "commonMistakes": "横纵坐标顺序写反，符号判断错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第7章', '象限', '{"coreKnowledge": "掌握四个象限内点的坐标特征", "solutionMethods": "第一象限(+,+)，第二象限(-,+)，第三象限(-,-)，第四象限(+,-)", "commonMistakes": "象限位置与坐标符号对应错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第7章', '坐标轴上的点', '{"coreKnowledge": "掌握坐标轴上点的坐标特征", "solutionMethods": "x轴上的点纵坐标为0，y轴上的点横坐标为0，原点坐标为(0,0)", "commonMistakes": "坐标轴上的点与象限内的点混淆"}'::jsonb),

-- 第八章 二元一次方程组
(gen_random_uuid(), '人教版', '数学', '七年级下册第8章', '二元一次方程', '{"coreKnowledge": "理解二元一次方程的概念", "solutionMethods": "含有两个未知数，含有未知数的项的次数都是1的方程叫做二元一次方程", "commonMistakes": "忽略未知数的次数都是1"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第8章', '二元一次方程组', '{"coreKnowledge": "理解二元一次方程组的概念", "solutionMethods": "方程组中有两个未知数，含有每个未知数的项的次数都是1，并且一共有两个方程", "commonMistakes": "二元一次方程组的识别错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第8章', '二元一次方程的解', '{"coreKnowledge": "理解二元一次方程解的概念", "solutionMethods": "使二元一次方程两边的值相等的两个未知数的值，叫做二元一次方程的解", "commonMistakes": "解是一对值，不能只写一个"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第8章', '代入消元法', '{"coreKnowledge": "会用代入消元法解二元一次方程组", "solutionMethods": "把一个方程中的一个未知数用含另一个未知数的式子表示出来，再代入另一个方程", "commonMistakes": "代入时计算错误，忘记代入后只剩一个未知数"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第8章', '加减消元法', '{"coreKnowledge": "会用加减消元法解二元一次方程组", "solutionMethods": "把两个方程的两边分别相加或相减，消去一个未知数", "commonMistakes": "加减时对应项没有对齐，系数没有统一"}'::jsonb),

-- 第九章 不等式与不等式组
(gen_random_uuid(), '人教版', '数学', '七年级下册第9章', '不等式', '{"coreKnowledge": "理解不等式的概念", "solutionMethods": "用符号<或>表示大小关系的式子叫做不等式", "commonMistakes": "不等号使用错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第9章', '不等式的解集', '{"coreKnowledge": "理解不等式解和解集的概念", "solutionMethods": "使不等式成立的未知数的值叫做不等式的解；所有解组成解集", "commonMistakes": "解与解集的概念混淆"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第9章', '不等式的性质', '{"coreKnowledge": "掌握不等式的性质", "solutionMethods": "性质1：加减同一个数，不等号方向不变；性质2：乘除同一个正数，不等号方向不变；性质3：乘除同一个负数，不等号方向改变", "commonMistakes": "性质3应用时忘记改变不等号方向"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第9章', '一元一次不等式', '{"coreKnowledge": "会解一元一次不等式", "solutionMethods": "去分母→去括号→移项→合并同类项→系数化为1（注意系数为负数时要变号）", "commonMistakes": "系数化为1时，负数系数忘记变号"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级下册第9章', '一元一次不等式组', '{"coreKnowledge": "会解一元一次不等式组", "solutionMethods": "分别求出每个不等式的解集，再取公共部分", "commonMistakes": "解集的公共部分找错"}'::jsonb);
