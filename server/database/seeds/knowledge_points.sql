-- 人教版数学知识点种子数据
-- 七年级上册
INSERT INTO knowledge_point (id, version, subject, chapter, name, content) VALUES
-- 第一章 有理数
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '正数和负数', '{"coreKnowledge": "理解正数、负数的概念，能用正数、负数表示具有相反意义的量", "solutionMethods": "用正负数表示相反意义的量时，先规定一个方向为正，则相反方向为负", "commonMistakes": "混淆相反意义的量的表示，忽略0既不是正数也不是负数"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '有理数', '{"coreKnowledge": "理解有理数的概念，掌握有理数的分类", "solutionMethods": "按定义分类：整数和分数；按性质分类：正有理数、0、负有理数", "commonMistakes": "误认为有限小数和无限循环小数不是有理数"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '数轴', '{"coreKnowledge": "理解数轴的三要素：原点、正方向、单位长度，能用数轴表示有理数", "solutionMethods": "画数轴时先确定原点，再确定正方向和单位长度", "commonMistakes": "数轴三要素不全，单位长度不统一"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '相反数', '{"coreKnowledge": "理解相反数的概念，掌握相反数的性质", "solutionMethods": "求相反数：改变数的符号；几何意义：数轴上关于原点对称的两点", "commonMistakes": "认为相反数就是负数，混淆相反数与倒数的概念"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '绝对值', '{"coreKnowledge": "理解绝对值的概念，掌握绝对值的性质和运算", "solutionMethods": "正数的绝对值是它本身，负数的绝对值是它的相反数，0的绝对值是0", "commonMistakes": "忽略绝对值的非负性，对绝对值方程求解时漏解"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '有理数的大小比较', '{"coreKnowledge": "掌握有理数大小比较的方法", "solutionMethods": "数轴法：右边的数总比左边的大；法则法：正数>0>负数", "commonMistakes": "两个负数比较大小时，误认为绝对值大的数就大"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '有理数的加法', '{"coreKnowledge": "掌握有理数加法法则和运算律", "solutionMethods": "同号相加取相同符号，异号相加取绝对值较大数的符号", "commonMistakes": "符号判断错误，忽略加法交换律和结合律的应用"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '有理数的减法', '{"coreKnowledge": "理解减法法则，能进行有理数的减法运算", "solutionMethods": "减法转化为加法：a-b=a+(-b)", "commonMistakes": "减法转化为加法时，忘记改变减数的符号"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '有理数的乘法', '{"coreKnowledge": "掌握有理数乘法法则和运算律", "solutionMethods": "同号得正，异号得负，绝对值相乘", "commonMistakes": "符号判断错误，多个负数相乘时符号判断出错"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '有理数的除法', '{"coreKnowledge": "掌握有理数除法法则", "solutionMethods": "除以一个数等于乘以这个数的倒数；同号得正，异号得负", "commonMistakes": "忽略除数不能为0，倒数计算错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '乘方', '{"coreKnowledge": "理解乘方的概念，掌握乘方的运算", "solutionMethods": "负数的奇次幂是负数，负数的偶次幂是正数", "commonMistakes": "混淆(-a)ⁿ与-aⁿ的区别，乘方运算顺序错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第1章', '科学记数法', '{"coreKnowledge": "会用科学记数法表示大数", "solutionMethods": "a×10ⁿ的形式，其中1≤|a|<10，n为正整数", "commonMistakes": "a的取值范围错误，指数n计算错误"}'::jsonb),

-- 第二章 整式的加减
(gen_random_uuid(), '人教版', '数学', '七年级上册第2章', '用字母表示数', '{"coreKnowledge": "能用字母表示数，理解代数式的意义", "solutionMethods": "字母可以表示任意数，具有概括性和简洁性", "commonMistakes": "忽略字母表示数的取值范围"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第2章', '单项式', '{"coreKnowledge": "理解单项式的概念，掌握系数和次数", "solutionMethods": "单项式中的数字因数叫做系数，所有字母指数的和叫做次数", "commonMistakes": "系数包含前面的符号，次数是字母指数的和不是乘积"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第2章', '多项式', '{"coreKnowledge": "理解多项式的概念，掌握项、次数、常数项", "solutionMethods": "多项式中每个单项式叫做项，次数最高项的次数是多项式的次数", "commonMistakes": "多项式的次数不是所有项次数的和"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第2章', '整式', '{"coreKnowledge": "理解整式的概念，会识别整式", "solutionMethods": "单项式和多项式统称为整式", "commonMistakes": "分母中含有字母的式子不是整式"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第2章', '同类项', '{"coreKnowledge": "理解同类项的概念，能识别同类项", "solutionMethods": "所含字母相同，并且相同字母的指数也相同的项叫做同类项", "commonMistakes": "忽略同类项与系数无关，与字母顺序无关"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第2章', '合并同类项', '{"coreKnowledge": "掌握合并同类项的法则", "solutionMethods": "把同类项的系数相加，字母和字母的指数不变", "commonMistakes": "不是同类项的项不能合并，合并时系数计算错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第2章', '去括号', '{"coreKnowledge": "掌握去括号法则", "solutionMethods": "括号前是正号，去掉括号不变号；括号前是负号，去掉括号要变号", "commonMistakes": "括号前是负号时，忘记改变括号内所有项的符号"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第2章', '整式的加减', '{"coreKnowledge": "掌握整式加减的运算", "solutionMethods": "先去括号，再合并同类项", "commonMistakes": "去括号时漏乘，合并同类项时漏项"}'::jsonb),

-- 第三章 一元一次方程
(gen_random_uuid(), '人教版', '数学', '七年级上册第3章', '一元一次方程', '{"coreKnowledge": "理解一元一次方程的概念", "solutionMethods": "只含有一个未知数，未知数的次数都是1，等号两边都是整式", "commonMistakes": "忽略未知数次数为1，忽略等号两边是整式"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第3章', '等式的性质', '{"coreKnowledge": "掌握等式的两个基本性质", "solutionMethods": "性质1：等式两边加(减)同一个数或式子，结果仍相等；性质2：等式两边乘同一个数，或除以同一个不为0的数，结果仍相等", "commonMistakes": "除以同一个数时，忘记强调这个数不为0"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第3章', '解一元一次方程(一)', '{"coreKnowledge": "会用移项、合并同类项解方程", "solutionMethods": "移项要变号，把含未知数的项移到一边，常数项移到另一边", "commonMistakes": "移项时忘记变号"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第3章', '解一元一次方程(二)', '{"coreKnowledge": "会解含有括号的一元一次方程", "solutionMethods": "先去括号，再移项、合并同类项、系数化为1", "commonMistakes": "去括号时漏乘，符号错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第3章', '解一元一次方程(三)', '{"coreKnowledge": "会解含有分母的一元一次方程", "solutionMethods": "先去分母，再去括号，然后移项、合并同类项、系数化为1", "commonMistakes": "去分母时漏乘不含分母的项，分子是多项式时忘记加括号"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第3章', '实际问题与一元一次方程', '{"coreKnowledge": "能用一元一次方程解决实际问题", "solutionMethods": "审题→设未知数→列方程→解方程→检验→作答", "commonMistakes": "设未知数不当导致方程复杂，等量关系找错"}'::jsonb),

-- 第四章 几何图形初步
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '立体图形与平面图形', '{"coreKnowledge": "认识常见的立体图形和平面图形", "solutionMethods": "立体图形：柱体、锥体、球体；平面图形：三角形、四边形、圆等", "commonMistakes": "混淆立体图形和平面图形的概念"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '从不同方向看立体图形', '{"coreKnowledge": "能画出从不同方向看立体图形得到的平面图形", "solutionMethods": "主视图、俯视图、左视图", "commonMistakes": "三视图的对应关系错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '立体图形的展开图', '{"coreKnowledge": "了解常见立体图形的展开图", "solutionMethods": "正方体有11种展开图，要熟悉常见的展开图", "commonMistakes": "展开图折叠后对应面判断错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '点、线、面、体', '{"coreKnowledge": "理解点、线、面、体的概念及相互关系", "solutionMethods": "点动成线，线动成面，面动成体", "commonMistakes": "对几何图形的构成理解不清"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '直线、射线、线段', '{"coreKnowledge": "理解直线、射线、线段的概念和表示方法", "solutionMethods": "直线无端点，射线有一个端点，线段有两个端点", "commonMistakes": "表示方法错误，混淆三种线的特点"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '直线公理', '{"coreKnowledge": "掌握两点确定一条直线", "solutionMethods": "过两点有且只有一条直线", "commonMistakes": "对公理的理解不准确"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '线段的大小比较', '{"coreKnowledge": "会比较线段的大小", "solutionMethods": "度量法或叠合法", "commonMistakes": "线段比较与直线比较混淆"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '线段的和差', '{"coreKnowledge": "理解线段的和差运算", "solutionMethods": "作一条线段等于已知线段的和或差", "commonMistakes": "尺规作图方法不熟练"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '线段的中点', '{"coreKnowledge": "理解线段中点的概念和性质", "solutionMethods": "把一条线段分成两条相等线段的点叫做中点", "commonMistakes": "中点的计算错误，分类讨论不完整"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '两点之间线段最短', '{"coreKnowledge": "掌握两点之间线段最短", "solutionMethods": "两点之间的所有连线中，线段最短", "commonMistakes": "应用时不能正确识别最短路径"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '两点的距离', '{"coreKnowledge": "理解两点间距离的概念", "solutionMethods": "连接两点的线段的长度，叫做这两点的距离", "commonMistakes": "距离是长度，不是线段本身"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '角', '{"coreKnowledge": "理解角的概念和表示方法", "solutionMethods": "有公共端点的两条射线组成的图形叫做角", "commonMistakes": "角的表示方法使用不当"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '角的度量', '{"coreKnowledge": "掌握角的度量单位和换算", "solutionMethods": "1°=60′，1′=60″", "commonMistakes": "度分秒的换算错误，借位和进位出错"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '角的比较与运算', '{"coreKnowledge": "会比较角的大小，会进行角的和差运算", "solutionMethods": "度量法或叠合法", "commonMistakes": "角的运算时度分秒计算错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '角的平分线', '{"coreKnowledge": "理解角平分线的概念和性质", "solutionMethods": "从一个角的顶点出发，把这个角分成相等的两个角的射线叫做角平分线", "commonMistakes": "角平分线的计算和证明错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '七年级上册第4章', '余角和补角', '{"coreKnowledge": "理解余角和补角的概念和性质", "solutionMethods": "和为90°的两个角互为余角，和为180°的两个角互为补角；同角(等角)的余角相等，同角(等角)的补角相等", "commonMistakes": "余角和补角的概念混淆，性质应用错误"}'::jsonb);
