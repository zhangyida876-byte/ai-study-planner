-- 八年级上册
INSERT INTO knowledge_point (id, version, subject, chapter, name, content) VALUES
-- 第十一章 三角形
(gen_random_uuid(), '人教版', '数学', '八年级上册第11章', '三角形的边', '{"coreKnowledge": "理解三角形的概念和三边关系", "solutionMethods": "三角形两边之和大于第三边，两边之差小于第三边", "commonMistakes": "判断三条线段能否组成三角形时出错"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第11章', '三角形的高、中线、角平分线', '{"coreKnowledge": "理解三角形的高、中线、角平分线的概念", "solutionMethods": "从顶点向对边作垂线，顶点与垂足间的线段是高；连接顶点与对边中点的线段是中线；平分内角的线段是角平分线", "commonMistakes": "钝角三角形的高在外部，容易画错"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第11章', '三角形的稳定性', '{"coreKnowledge": "理解三角形具有稳定性", "solutionMethods": "三角形的三边确定后，形状和大小就确定了", "commonMistakes": "与四边形的不稳定性混淆"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第11章', '三角形的内角', '{"coreKnowledge": "掌握三角形内角和定理", "solutionMethods": "三角形三个内角的和等于180°", "commonMistakes": "证明过程不规范"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第11章', '直角三角形的性质', '{"coreKnowledge": "掌握直角三角形的性质", "solutionMethods": "直角三角形的两个锐角互余", "commonMistakes": "互余与互补混淆"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第11章', '三角形的外角', '{"coreKnowledge": "理解三角形外角的概念和性质", "solutionMethods": "三角形的外角等于与它不相邻的两个内角的和", "commonMistakes": "外角性质应用时找错内角"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第11章', '多边形的内角和', '{"coreKnowledge": "掌握多边形内角和公式", "solutionMethods": "n边形内角和等于(n-2)×180°", "commonMistakes": "公式记错，n的含义理解错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第11章', '多边形的外角和', '{"coreKnowledge": "掌握多边形外角和", "solutionMethods": "多边形的外角和等于360°", "commonMistakes": "与内角和混淆"}'::jsonb),

-- 第十二章 全等三角形
(gen_random_uuid(), '人教版', '数学', '八年级上册第12章', '全等三角形', '{"coreKnowledge": "理解全等三角形的概念和性质", "solutionMethods": "能够完全重合的两个三角形叫做全等三角形；全等三角形的对应边相等，对应角相等", "commonMistakes": "对应边、对应角找错"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第12章', '边边边(SSS)', '{"coreKnowledge": "掌握SSS判定方法", "solutionMethods": "三边分别相等的两个三角形全等", "commonMistakes": "对应边判断错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第12章', '边角边(SAS)', '{"coreKnowledge": "掌握SAS判定方法", "solutionMethods": "两边和它们的夹角分别相等的两个三角形全等", "commonMistakes": "必须是夹角，不是夹角的不能判定"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第12章', '角边角(ASA)', '{"coreKnowledge": "掌握ASA判定方法", "solutionMethods": "两角和它们的夹边分别相等的两个三角形全等", "commonMistakes": "必须是夹边，对应关系找错"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第12章', '角角边(AAS)', '{"coreKnowledge": "掌握AAS判定方法", "solutionMethods": "两角分别相等且其中一组等角的对边相等的两个三角形全等", "commonMistakes": "与ASA混淆"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第12章', '斜边直角边(HL)', '{"coreKnowledge": "掌握HL判定方法", "solutionMethods": "斜边和一条直角边分别相等的两个直角三角形全等", "commonMistakes": "仅适用于直角三角形"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第12章', '角的平分线的性质', '{"coreKnowledge": "掌握角平分线的性质", "solutionMethods": "角的平分线上的点到角的两边的距离相等", "commonMistakes": "距离是指垂线段的长度"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第12章', '角的平分线的判定', '{"coreKnowledge": "掌握角平分线的判定", "solutionMethods": "角的内部到角的两边距离相等的点在角的平分线上", "commonMistakes": "判定条件记错"}'::jsonb),

-- 第十三章 轴对称
(gen_random_uuid(), '人教版', '数学', '八年级上册第13章', '轴对称图形', '{"coreKnowledge": "理解轴对称图形的概念", "solutionMethods": "如果一个图形沿一条直线折叠，直线两旁的部分能够互相重合，这个图形就是轴对称图形", "commonMistakes": "与两个图形成轴对称混淆"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第13章', '轴对称', '{"coreKnowledge": "理解两个图形成轴对称的概念", "solutionMethods": "把一个图形沿着某一条直线折叠，如果它能够与另一个图形重合，那么就说这两个图形成轴对称", "commonMistakes": "概念理解不清"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第13章', '线段的垂直平分线', '{"coreKnowledge": "掌握线段垂直平分线的性质和判定", "solutionMethods": "线段垂直平分线上的点与这条线段两个端点的距离相等；与线段两个端点距离相等的点在这条线段的垂直平分线上", "commonMistakes": "性质应用时出错"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第13章', '等腰三角形', '{"coreKnowledge": "掌握等腰三角形的性质", "solutionMethods": "等腰三角形的两个底角相等(等边对等角)；顶角平分线、底边上的中线、底边上的高相互重合(三线合一)", "commonMistakes": "三线合一的应用条件理解不清"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第13章', '等腰三角形的判定', '{"coreKnowledge": "掌握等腰三角形的判定", "solutionMethods": "如果一个三角形有两个角相等，那么这两个角所对的边也相等(等角对等边)", "commonMistakes": "判定与性质混淆"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第13章', '等边三角形', '{"coreKnowledge": "掌握等边三角形的性质和判定", "solutionMethods": "性质：三边相等，三个角都等于60°；判定：三边相等，或三个角相等，或有一个角是60°的等腰三角形", "commonMistakes": "判定条件不完整"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第13章', '含30°角的直角三角形', '{"coreKnowledge": "掌握含30°角的直角三角形的性质", "solutionMethods": "在直角三角形中，如果一个锐角等于30°，那么它所对的直角边等于斜边的一半", "commonMistakes": "条件记错，比例关系记反"}'::jsonb),

-- 第十四章 整式的乘法与因式分解
(gen_random_uuid(), '人教版', '数学', '八年级上册第14章', '同底数幂的乘法', '{"coreKnowledge": "掌握同底数幂的乘法法则", "solutionMethods": "aᵐ·aⁿ=aᵐ⁺ⁿ(m,n都是正整数)", "commonMistakes": "指数相乘而不是相加"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第14章', '幂的乘方', '{"coreKnowledge": "掌握幂的乘方法则", "solutionMethods": "(aᵐ)ⁿ=aᵐⁿ(m,n都是正整数)", "commonMistakes": "指数相加而不是相乘"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第14章', '积的乘方', '{"coreKnowledge": "掌握积的乘方法则", "solutionMethods": "(ab)ⁿ=aⁿbⁿ(n是正整数)", "commonMistakes": "只给其中一个因式乘方"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第14章', '单项式乘单项式', '{"coreKnowledge": "掌握单项式乘单项式的法则", "solutionMethods": "系数相乘，同底数幂相乘，单独的字母连同指数作为积的因式", "commonMistakes": "系数计算错误，漏乘单独的字母"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第14章', '单项式乘多项式', '{"coreKnowledge": "掌握单项式乘多项式的法则", "solutionMethods": "用单项式去乘多项式的每一项，再把所得的积相加", "commonMistakes": "漏乘多项式的某一项"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第14章', '多项式乘多项式', '{"coreKnowledge": "掌握多项式乘多项式的法则", "solutionMethods": "用一个多项式的每一项去乘另一个多项式的每一项，再把所得的积相加", "commonMistakes": "漏乘，符号错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第14章', '平方差公式', '{"coreKnowledge": "掌握平方差公式", "solutionMethods": "(a+b)(a-b)=a²-b²", "commonMistakes": "公式记错，符号错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第14章', '完全平方公式', '{"coreKnowledge": "掌握完全平方公式", "solutionMethods": "(a+b)²=a²+2ab+b²；(a-b)²=a²-2ab+b²", "commonMistakes": "漏写中间项，中间项符号错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第14章', '因式分解', '{"coreKnowledge": "理解因式分解的概念", "solutionMethods": "把一个多项式化成几个整式的积的形式，叫做把这个多项式因式分解", "commonMistakes": "与整式乘法混淆，分解不彻底"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第14章', '提公因式法', '{"coreKnowledge": "掌握提公因式法", "solutionMethods": "找出多项式各项的公因式，把它提取出来", "commonMistakes": "公因式找不全，提取后符号错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '八年级上册第14章', '公式法', '{"coreKnowledge": "掌握公式法分解因式", "solutionMethods": "平方差公式、完全平方公式", "commonMistakes": "公式选择错误，分解不彻底"}'::jsonb),

-- 九年级上册二次函数（已有数据补充）
(gen_random_uuid(), '人教版', '数学', '九年级上册第22章', '二次函数', '{"coreKnowledge": "理解二次函数的概念", "solutionMethods": "形如y=ax²+bx+c(a,b,c是常数，a≠0)的函数叫做二次函数", "commonMistakes": "忽略a≠0的条件"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '九年级上册第22章', '二次函数y=ax²的图象', '{"coreKnowledge": "掌握y=ax²的图象和性质", "solutionMethods": "抛物线，顶点在原点，对称轴是y轴；a>0时开口向上，a<0时开口向下；|a|越大开口越小", "commonMistakes": "开口方向与a的符号关系记错"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '九年级上册第22章', '二次函数y=a(x-h)²+k的图象', '{"coreKnowledge": "掌握顶点式二次函数的图象和性质", "solutionMethods": "顶点坐标(h,k)，对称轴是直线x=h", "commonMistakes": "顶点坐标符号记错，对称轴方程写错"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '九年级上册第22章', '二次函数y=ax²+bx+c的图象', '{"coreKnowledge": "掌握一般式二次函数的图象和性质", "solutionMethods": "顶点坐标(-b/2a,(4ac-b²)/4a)，对称轴是直线x=-b/2a", "commonMistakes": "顶点坐标公式记错"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '九年级上册第22章', '用待定系数法求二次函数解析式', '{"coreKnowledge": "会用待定系数法求二次函数解析式", "solutionMethods": "根据已知条件选择合适的形式：一般式、顶点式、交点式", "commonMistakes": "形式选择不当，计算错误"}'::jsonb),
(gen_random_uuid(), '人教版', '数学', '九年级上册第22章', '二次函数与一元二次方程', '{"coreKnowledge": "理解二次函数与一元二次方程的关系", "solutionMethods": "抛物线y=ax²+bx+c与x轴的交点横坐标就是方程ax²+bx+c=0的根", "commonMistakes": "关系理解不清"}'::jsonb);
