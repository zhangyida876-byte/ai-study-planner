import type { StageSlug } from '@client/src/config/stages';

export type InternalModuleKey = 'diagnosis' | 'plan' | 'study-plan' | 'knowledge' | 'advice';

const COMMON_MATERIALS: string[] = [
  '异议处理统一原则：先共情、再拆问题、再给可执行动作，不和家长争辩。',
  '活动课包价格口径：以公司最新活动价和当期政策为准，禁止引用过期价格。',
  '产品介绍主线：AI拍题精学、AI错题本、AI定制班、同步刷题/专项突破，强调先学思路再做题。',
  '服务承诺表达：学习报告可追踪、过程可复盘、服务有陪伴，不做夸张保分承诺。',
  '竞品对比口径：重点说教材同步、短时高效、可反复学习和执行闭环，不做贬低式对比。',
];

const STAGE_MATERIALS: Record<StageSlug, string[]> = {
  elementary: [
    '小学微信跟进重点：先抓学习兴趣和习惯，再做基础能力提升。',
    '小学语文：识字词、古诗背诵、阅读和写作分模块推进。',
    '小学数学：计算与应用题并行，强调一题三会和思维启蒙。',
    '小学英语：自然拼读+情景学习，降低开口门槛。',
  ],
  middle: [
    '初中微信跟进重点：以中考能力为导向，突出题型方法和查漏补缺。',
    '初中文科：高频短时记忆+快背体系，提升提分效率。',
    '初中理科：同步课打底，专项突破拉分，错题回炉固化。',
    '初中家长沟通：先稳节奏，再拉成绩，避免一次性压强过大。',
  ],
  high: [
    '高中微信跟进重点：大学-专业-就业一体化，不再沿用初中叙事。',
    '高中策略：选科约束、院校层次、专业路径和就业前景同时评估。',
    '高中执行：时间非常稀缺，强调周目标与周复盘闭环。',
    '高中沟通：尊重学生选择权，家长以目标管理和资源支持为主。',
  ],
};

const MODULE_RULES: Record<InternalModuleKey, string[]> = {
  diagnosis: [
    '诊断输出必须先给结论，再给原因，最后给动作。',
    '家长话术要口语化、有温度，避免空泛术语。',
    '如果涉及产品建议，优先引用内部产品卖点与案例表达。',
  ],
  plan: [
    '升学规划输出顺序：当前分位 -> 目标差距 -> 时间节点 -> 执行动作。',
    '政策只讲关键点，必须结合最新公开信息，不堆砌长段背景。',
    '高中文案必须落在院校与专业，不回到中考主线。',
  ],
  'study-plan': [
    '学习计划要可落地：每周目标、每日任务、验收标准三件套。',
    '优先用内部“先稳后提”沟通框架，避免高压指令式表达。',
    '围绕弱科先补、强科稳住，形成短周期复盘机制。',
  ],
  knowledge: [
    '知识点讲解采用“核心概念-易错点-实操题型”结构，贴合内部讲解节奏。',
    '先讲学生能做什么，再讲理论定义，减少距离感。',
    '输出要能直接转成家长或学生可执行的话术。',
  ],
  advice: [
    '建议话术统一使用“共情开场-目标对齐-本周动作-复盘收口”四段式。',
    '语言要求：大白话、短句、可执行，不说空话套话。',
    '若内部素材与外部信息冲突：产品/服务口径以内部为准，政策数据以公开最新为准。',
  ],
};

const OBJECTION_HANDLING_DOC: string[] = [
  '异议处理文档要点：先确认家长担心的是“价格、效果、时间还是孩子配合度”，不要混答。',
  '异议处理文档要点：回应价格时先回到目标收益，再给可执行起步方案和复盘节点。',
  '异议处理文档要点：回应效果时必须说“可追踪指标 + 周复盘动作”，禁止空口保证提分。',
  '异议处理文档要点：回应孩子不配合时，先降门槛再提要求，先完成再完美。',
  '异议处理文档要点：收口必须给下一步动作（本周体验、样题诊断、复盘时间）。',
];

interface ObjectionHandlingScript {
  id: string;
  title: string;
  stageLabel?: string;
  source: string;
  sourceYear?: number;
  sourceUrl: string;
  keywords: string[];
  content: string;
  materialHints?: string[];
}

const OBJECTION_HANDLING_SCRIPTS: ObjectionHandlingScript[] = [
  {
    id: 'time-no-time',
    title: '课程太多，没时间学',
    stageLabel: '通用',
    source: '小学四部培训：异议处理',
    sourceUrl: 'https://guanghe.feishu.cn/docx/doxcnrnsrjC2R64dozGViJj3rHf',
    keywords: ['没时间', '时间少', '作业多', '课程太多', '学不过来', '时间不够', '没时间报课', '没时间想报'],
    content:
      '家长对于孩子的培养还是很重视的，舞蹈可以提升孩子的气质还是挺好的，但是孩子目前是五年级了，孩子年级越高，肯定全部心思都是放在校内知识点上面。初中3年学习9个学科，时间相对紧张，初中知识点也会越来越难，而且中考需要考全科的。孩子每一个学科随时都有可能遇到问题。如果遇到了问题不及时去解决的话，一天一个问题，那么一年堆积下来就365个问题。洋葱课程知识点涵盖非常全面，基础中等，难点拔高全部都包含。随时打开咱们洋葱学他不懂的知识点，做到有问题不堆积、及时解决。',
  },
  {
    id: 'boarding-time',
    title: '住校没时间',
    stageLabel: '初中/高中',
    source: '代表性异议处理文档--白小峰',
    sourceUrl: 'https://guanghe.feishu.cn/wiki/FQWdwjRQOiNn6lklRpgcNOIun5b',
    keywords: ['住校', '回家晚', '没时间', '晚自习', '放假少'],
    content:
      '第一咱们洋葱的同学本身70％都是住校的，很多都是两周一个月回来一次。咱们是属于学习工具，不是报了之后每天盯在上面学，而是专门针对孩子薄弱点。考试之前针对当地考试题型学专项课，一周下来各个学科加起来花1-2个小时就可以了。第二这样是针对性最强的，反而提升了孩子学习效率，孩子每周把堆积的问题解决了，成绩自然而然就提升了。第三越是时间少越适合学洋葱的课程，因为这样的方式学习效率最高。',
    materialHints: ['可配发住校生利用周末/放假集中查漏补缺的成交截图或学习安排截图，降低“没时间用”的顾虑。'],
  },
  {
    id: 'effect-doubt',
    title: '担心效果',
    source: '异议处理---案例提取',
    sourceUrl: 'https://guanghe.feishu.cn/docx/Csn4d6brBo1nS6xoTdjcm8wznQe',
    keywords: ['效果', '没效果', '担心提分', '有没有用', '不相信'],
    content:
      '第一您可以看一下孩子经常在主动的学洋葱的课程，用他听得懂、更轻松的方式去提升，效果肯定是最好的。第二您会发现孩子每个学科在学习中都会遇到问题，都用得上，学习一段时间之后，自己的成绩提升了，同时孩子的学习主动性会变强很多，兴趣是最好的老师。第三我们课程是非常有规划的，每周针对性把薄弱点解决，堆积的问题解决，孩子成绩提升起来就非常快，然后再针对当地考试题型学专项课。',
  },
  {
    id: 'child-cannot-persist',
    title: '担心孩子坚持不下来',
    source: '代表性异议处理文档--白小峰',
    sourceUrl: 'https://guanghe.feishu.cn/wiki/FQWdwjRQOiNn6lklRpgcNOIun5b',
    keywords: ['坚持不下来', '三分钟热度', '不愿意学', '怕浪费', '不自律'],
    content:
      '第一您可以看一下孩子这几天在洋葱上主动学的多认真，洋葱是用孩子听得懂喜欢的方式去学，学习持续性肯定是最强的。第二您可以看一下其他家长都是这样规划的，而且成绩提升效果非常好。第三您看一下其他家长都是报的小学+初中比您时间更长的课包。第四我这边也会帮孩子去做规划，教他怎么学，以后每一周、每个月、考试之前怎么安排，会帮孩子规划好的。',
  },
  {
    id: 'price-too-expensive',
    title: '价格太贵',
    source: '小学四部培训：异议处理',
    sourceUrl: 'https://guanghe.feishu.cn/docx/doxcnrnsrjC2R64dozGViJj3rHf',
    keywords: ['太贵', '价格贵', '学费高', '预算不够', '没钱'],
    content:
      '这确实是最优惠的学费了家长，我们所有的课包活动是公司统一规定，对每个学员都是公平的一样的。咱们家两个孩子您只需要花一份学费，如果两个孩子单独买，就算后面孩子不学洋葱，外面的辅导班更贵，随便一个暑假班都要大几千块钱。我们课程可能一开始会觉得一下拿出几千会有点多，但是后面就没有花钱的地方了。',
  },
  {
    id: 'need-cheaper-last-step',
    title: '最后想再便宜点',
    source: '代表性异议处理文档--白小峰',
    sourceUrl: 'https://guanghe.feishu.cn/wiki/FQWdwjRQOiNn6lklRpgcNOIun5b',
    keywords: ['便宜点', '再优惠', '少一点', '最后优惠', '砍价'],
    content:
      '第一您报名不是交给我，是交给咱们洋葱，能给您优惠肯定给您最低优惠的，本身您参加的就是我们九周年年度特惠。第二所有参加活动的家长都是官方活动订单报名的，不会说这个家长多300那个家长少200，多一块钱少一块钱都是支付不了的。第三我相信您过来学最在意的还是孩子的学习效果，相信咱们考一个重点高中，不是这几千几万块钱能够去衡量的。',
  },
  {
    id: 'no-tablet-discount',
    title: '不要平板，能不能优惠',
    source: '异议处理',
    sourceUrl: 'https://guanghe.feishu.cn/wiki/VTbdwLAoUiPbigkoedlc2zyPng0',
    keywords: ['不要平板', '有平板了', '平板能退吗', '不要赠品', '赠品'],
    content:
      '洋葱这个活动给咱们限额前1000个名额赠送洋葱学习平板，不是觉得同学家里缺平板。赠送平板是因为和洋葱app是智能绑定学习系统，同学在洋葱学习的课程记录和练习错题会实时生成学习报告和错题集，系统会推送高配易错题库和课程，能提高学习效率。洋葱学习平板带类纸护眼技术屏，不反光不折光。',
  },
  {
    id: 'single-subject-core-general',
    title: '只想报单科：认可数学后引导全科权益',
    stageLabel: '通用',
    source: '洋葱异议处理话术库【2025正式版】',
    sourceUrl: 'https://guanghe.feishu.cn/docx/Csn4d6brBo1nS6xoTdjcm8wznQe',
    keywords: [
      '只想学数学单科',
      '只想单科',
      '只要单科',
      '只报单科',
      '想报单科',
      '报单科',
      '同步课',
      '只买一年',
      '买一年',
      '单科',
    ],
    content:
      '孩子妈妈，看得出您对孩子的学习是非常非常关注的，老师跟您聊了这么多其实第一是希望能通过洋葱帮助您解决孩子的学习问题，第二也是希望您能买到最佳性价比的产品，不让您花一份冤枉钱；\n我们都知道，数学是最难的学科，您也非常认可洋葱数学这一科对吧？如果洋葱能把数学都给孩子提升上去，那其他学科更不用多说了；\n洋葱的最大特色就是动画ai形式，说明这种形式确实能解决学校课堂或者是其他地方解决不了的复杂问题，您其他学科有报说明家长也有意识想让孩子全方位提升，在洋葱可以花最少的钱，全科都解决，比您其他地方省钱多了，而且孩子也不用换来换去。\n您要是在APP单独报是1600一科，三年下来就1万多了，单报不划算。咱们现在是12周年和暑期大促特惠活动史无前例，现在只需要花XXXX可以学X年还能送平板，无论是中考还是高考，考试都是看全科总分，别的科目也要均衡发展，您这次帮孩子定下来，就能开通全部权限了；\n您把APP打开，我带您看下价格···',
  },
  {
    id: 'single-subject-core-middle-1',
    title: '只想报单科：单科不划算，全科更能提总分',
    stageLabel: '初中',
    source: '洋葱异议处理话术库【2025正式版】',
    sourceUrl: 'https://guanghe.feishu.cn/docx/Csn4d6brBo1nS6xoTdjcm8wznQe',
    keywords: ['只想学数学', '单科', '不报全科', '只要一科', '只报单科', '想报单科', '报单科', '同步课', '培优课'],
    content:
      '家长我理解你的想法的，但我们最终是为了提升成绩让同学越学越轻松才去报课的，不是为了报课而报课，应付我们作为家长的责任。数理化生地都是理科，理科不分家，光学数学提个20分也难对总分不明显，没有成就感积极性。现在初中都是五五分流，竞争都比较大，孩子想上高中甚至更好的高中，是一定不能有偏科的，而且多科一起学比单科提分会快很多。孩子单独补一科数学，就算数学补起来了，其他科目要是不理想，总分还是不高，排名一样上不去。现在中考改革，学科关联性非常强，数学里面会涉及到物理甚至化学的内容，如果其他科目掌握不好，数学知识点学得再好，考试数学题涉及到其他科目的知识点时，孩子一样做不出来，最终考试也出不了好成绩。单科也不划算，同步课498+培优课1098=1596，报3年也要4800，其他学科学不了，其他权益也享受不了。我们想报单科无非是怕同学有压力、没时间去学习，洋葱5-8分钟能帮同学解决校内30-40分的学习问题，提前预习知识点后再学会运用，才能提升效率。我们花单科不到的费用学全科，不仅课程权益最多，后续效果也能保证。你完全可以相信老师，我们就选择优惠活动课包好的吧？',
    materialHints: ['可配发“单报数学后其他科目仍需补强”的聊天截图案例，辅助说明考试看总分、不能只盯单科。'],
  },
  {
    id: 'single-subject-core-middle-2',
    title: '只想报单科：全科解锁不是增加压力，是防偏科',
    stageLabel: '初中',
    source: '洋葱异议处理话术库【2025正式版】',
    sourceUrl: 'https://guanghe.feishu.cn/docx/Csn4d6brBo1nS6xoTdjcm8wznQe',
    keywords: ['只想单科', '只报单科', '没时间学', '怕报多浪费', '不报全科', '全科', '单科'],
    content:
      '孩子妈妈，可以理解您担心孩子没时间学，怕报多了没时间学就浪费了，这个是很正常的。首先，现在初高中孩子学科多、科目难度大、作业多，但是现在中考都全科全考，看的是总分，不是单科成绩。然后，我们这个课程时间短，一节课5-8分钟，不是说报名后每天每个学科都学，本身就是哪个学科有问题，在自己有时间的时候随时打开做补充，这样孩子才不会出现偏科，总分提高更快。其次，我们现在之所以课包都是全科给你解锁，你并没有花全科的价格，你单买一科买到中考，比这个套餐价格都要贵。现在相当于只花了两科不到的价格，其他学科免费开通。我们这样设计，就是希望更多学生能在洋葱总分提高，才有更大机会考上重点高中。最后，报名只是刚开始，后期也是我服务你，前期还会有一对一助教老师给你做规划，包含寒暑假、平时上学期间，都会给孩子规划好明确的学习要求，所以你放心哈，帮孩子定下来吧？',
  },
  {
    id: 'single-subject-core-high',
    title: '高中只想报单科：课外学习做减法，按问题点解决',
    stageLabel: '高中',
    source: '洋葱异议处理话术库【2025正式版】',
    sourceUrl: 'https://guanghe.feishu.cn/docx/Csn4d6brBo1nS6xoTdjcm8wznQe',
    keywords: ['高中单科', '只想单科', '只报单科', '没时间', '同步强化', '报单科一年', '全科学一年', '单科'],
    content:
      '理解的，洋葱这边不需要咱们定时定点去上课，就是在遇到学习问题的时候可以通过洋葱及时解决。平时放假、节假日和寒暑假，是完全有时间利用洋葱去学习的，只需要灵活安排自己的课外时间就行了，这已经是最适合高中生的学习模式了。其次，学习肯定是需要未雨绸缪的，学校老师讲课永远是在讲新课、一遍过大纲，知识点关联性强，所以学期内需要在课外及时查漏补缺，学习中遇到或者遗留的问题要及时解决，不然就恶性循环了。高中课外时间紧不是课外不学的理由，而是更应该未雨绸缪提前学、及时有效地学。课外学习的效果和价值，不在于花多少时间，而在于及时性、针对性和有效性。寒暑假预习衔接、复习巩固，学期内利用课外时间有效解决阶段性学习问题。这个洋葱大会员就是最佳选择，像感冒了买一盒感冒药，不是为了把药吃完，而是及时对症下药。课外学习是做减法的，在于及时性、有效性和针对性，不在于花多少时间。正常报单科一年就要3500，三年要一万多，现在只需要一半的费用就可以全科学一年，性价比非常高，趁着有优惠尽快安排吧？',
  },
  {
    id: 'version-not-match',
    title: '版本不同步',
    source: '异议处理',
    sourceUrl: 'https://guanghe.feishu.cn/wiki/VTbdwLAoUiPbigkoedlc2zyPng0',
    keywords: ['版本不同步', '教材不一样', '章节对不上', '人教版', '英语版本', '小学英语版本', '英语不同步'],
    content:
      '我们英语不是把每个版本课文同步一遍，我们是注重单词短语积累、语法时态从句这些重点难点、完形填空和阅读理解做题技巧学习。生物地理选用的是考点和知识点最齐全的人教版，和所学版本核心考点都是一样的，只是章节顺序不一样，洋葱本身就是查漏补缺，直接搜索到对应章节知识点题型即可。',
  },
  {
    id: 'child-initiative-weak',
    title: '孩子学习主动性差/自驱力不足',
    source: '异议处理---案例提取',
    sourceUrl: 'https://guanghe.feishu.cn/docx/Csn4d6brBo1nS6xoTdjcm8wznQe',
    keywords: [
      '学习主动性差',
      '学习主动性',
      '主动性差',
      '没有学习主动性',
      '自驱力不够',
      '不爱读书',
      '不主动学习',
    ],
    content:
      '其实我跟你说哈，现实里有多少孩子是自觉的呀，没几个吧。这时候咱们肯定得给孩子做规划、做选择。孩子在这个年纪，很多都不懂啥叫坚持。我见过好多成功培养孩子的家长，都是在后面一直鼓励孩子学习的。并且洋葱课程5到8分钟讲一个知识点，孩子哪没学会就学哪，不会给孩子造成学习负担。孩子排斥的是很多补课类辅导班，洋葱更像一个工具，哪个知识点不会就直接定位课程，5-8分钟解决一个知识点。',
    materialHints: ['可配发孩子主动学习、助教跟进、家长中心反馈或好评截图，证明不是单靠家长盯。'],
  },
  {
    id: 'compare-learning-machine',
    title: '和学习机或竞品对比',
    source: '异议处理',
    sourceUrl: 'https://guanghe.feishu.cn/wiki/VTbdwLAoUiPbigkoedlc2zyPng0',
    keywords: ['科大讯飞', '学习机', '学而思', '竞品', '对比'],
    content:
      '学习机一个是买平板，课程都内置在里面。洋葱是买课程，平板只是送的附属品，性质不一样。学习机课程大多是老师录屏讲课，洋葱课程是动画视频课，一节课大概5-8分钟，故事化讲解更通俗易懂。洋葱还有新中考课程，有视频讲解+新题练习+押题卷，从学到练到考更完整。',
  },
  {
    id: 'want-offline',
    title: '想学线下，不想线上',
    source: '异议处理',
    sourceUrl: 'https://guanghe.feishu.cn/wiki/VTbdwLAoUiPbigkoedlc2zyPng0',
    keywords: ['线下', '补习班', '一对一', '面授', '网课不行'],
    content:
      '线下课程都是定点定时、一遍过大纲，需要同学时时刻刻被动适应和跟着老师节奏走，一旦跟不上就白学了。在洋葱可以根据同学个性化情况安排学习时间、内容和进度快慢，并且可以反复学习。1V1更适合答疑和拔高，补差缺乏系统性；洋葱强系统性，且高中所有知识点和考点题型基本全覆盖，补差更合适。',
  },
  {
    id: 'wait-next-month',
    title: '想等下个月或寒暑假再报',
    source: '代表性异议处理文档--白小峰',
    sourceUrl: 'https://guanghe.feishu.cn/wiki/FQWdwjRQOiNn6lklRpgcNOIun5b',
    keywords: ['下个月', '寒假再报', '暑假再报', '先等等', '不着急'],
    content:
      '源于现在的时间段正在上学会遇到问题，最有兴趣、需要帮助、想学的时候，肯定要支持他鼓励他。学起来之后有小的进步会更加愿意学。源于活动截杀，最优惠的时候买我们最好的课程。',
  },
  {
    id: 'annual-price-gift',
    title: '活动价与赠品口径',
    source: '洋葱异议处理话术库【2025正式版】',
    sourceYear: 2025,
    sourceUrl: 'https://guanghe.feishu.cn/docx/XU3PdsygdooeoZxep7RcH2EVnNb',
    keywords: ['活动价', '赠品', '平板', '抵扣', '优惠券'],
    content:
      '活动课包价格口径：以公司最新活动价和当期政策为准，禁止引用过期价格。本页因业务发展带来的价格/活动/用户数量变动，不再做相关数字更改，需依据现有课包进行口述变动。不要赠品能否优惠时，需按官方活动规则说明，不能私自改价。',
  },
];

function normalizeObjectionQuery(query: string): string {
  return query.replace(/\s+/g, '').toLowerCase();
}

const OBJECTION_QUERY_CONCEPTS = [
  '没时间',
  '时间不够',
  '时间少',
  '作业多',
  '住校',
  '晚自习',
  '单科',
  '报单科',
  '想报单科',
  '只报单科',
  '只学一科',
  '只要一科',
  '不报全科',
  '全科',
  '价格',
  '太贵',
  '效果',
  '主动性',
  '不主动学习',
  '英语版本',
  '版本不同步',
  '不要平板',
  '线下',
  '学习机',
  '竞品',
  '寒假再报',
  '暑假再报',
  '先等等',
];

function extractQueryTerms(query: string): string[] {
  const tokens = query.match(/[\u4e00-\u9fa5a-zA-Z0-9]+/g) || [];
  const stopWords = new Set(['孩子', '家长', '这个', '那个', '怎么', '问题', '一下', '一下子']);
  const baseTerms = tokens.map((t) => t.trim()).filter((t) => t.length >= 2 && !stopWords.has(t));
  const splitTerms = baseTerms
    .flatMap((term) => term.split(/还是|或者|以及|并且|但是|没有|没|不是|不|想报|只想|只要|报|呀|呢|吗|么/))
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !stopWords.has(t));
  const normalized = normalizeObjectionQuery(query);
  const conceptTerms = OBJECTION_QUERY_CONCEPTS.filter((term) => normalized.includes(normalizeObjectionQuery(term)));
  const combinationTerms =
    normalized.includes('没时间') && normalized.includes('单科')
      ? ['没时间', '时间不够', '单科', '报单科', '想报单科']
      : [];
  return [...new Set([...baseTerms, ...splitTerms, ...conceptTerms, ...combinationTerms])];
}

function buildScriptHaystack(script: ObjectionHandlingScript): string {
  return normalizeObjectionQuery(`${script.title} ${script.keywords.join(' ')} ${script.content}`);
}

function isScriptMatched(query: string, script: ObjectionHandlingScript): boolean {
  const normalized = normalizeObjectionQuery(query);
  if (!normalized) return false;
  const haystack = buildScriptHaystack(script);
  if (haystack.includes(normalized)) return true;
  const terms = extractQueryTerms(query).map(normalizeObjectionQuery);
  return terms.some((term) => {
    if (term.length < 2) return false;
    if (haystack.includes(term)) return true;
    return script.keywords.some((keyword) => {
      const key = normalizeObjectionQuery(keyword);
      return key.length > 0 && (key.includes(term) || term.includes(key));
    });
  });
}

function scoreScriptMatch(query: string, script: ObjectionHandlingScript): number {
  const normalized = normalizeObjectionQuery(query);
  if (!normalized) return 0;
  const haystack = buildScriptHaystack(script);
  const terms = extractQueryTerms(query).map(normalizeObjectionQuery);
  let score = 0;
  if (haystack.includes(normalized)) score += 30;
  for (const term of terms) {
    if (term.length < 2) continue;
    if (haystack.includes(term)) score += 6;
  }
  for (const keyword of script.keywords) {
    const key = normalizeObjectionQuery(keyword);
    if (!key) continue;
    if (normalized.includes(key)) score += 10;
    else if (terms.some((term) => key.includes(term) || term.includes(key))) score += 3;
  }
  return score;
}

export function matchObjectionHandlingScript(query: string): string {
  const matched = OBJECTION_HANDLING_SCRIPTS.filter((script) => isScriptMatched(query, script))
    .map((script) => ({
      title: script.title,
      stageLabel: script.stageLabel || '通用',
      source: script.source,
      materialHints: script.materialHints || [],
      content: script.content.trim(),
      score: scoreScriptMatch(query, script),
    }))
    .sort((a, b) => b.score - a.score)
    .filter(Boolean);

  if (matched.length > 0) {
    return matched
      .map((item, index) => {
        const materialText = item.materialHints.length
          ? `\n可配发物料：${item.materialHints.join('；')}`
          : '';
        return `【话术选项${index + 1}｜${item.stageLabel}｜${item.title}】\n来源：${item.source}\n${item.content}${materialText}`;
      })
      .join('\n\n');
  }
  return '未匹配到相关异议话术，请更换关键词重试（例如：学习主动性差、英语版本不同步、住校没时间、价格太贵）。';
}

const SCRIPT_ANCHOR: Record<StageSlug, Record<InternalModuleKey, string>> = {
  elementary: {
    diagnosis: '先把学习兴趣和基础习惯稳住，再谈提分速度。',
    plan: '路线先走“基础打牢+重点突破”，不做超负荷安排。',
    'study-plan': '每天小步推进，周末复盘，孩子更容易坚持。',
    knowledge: '先补前置知识，再做同类题，先会做再做快。',
    advice: '先鼓励再提要求，孩子配合度会明显更高。',
  },
  middle: {
    diagnosis: '先抓核心失分点，再做题型和方法的针对训练。',
    plan: '中考规划以分差和时间节点驱动，动作必须可验收。',
    'study-plan': '周目标拆到每天，错题回炉是提分主抓手。',
    knowledge: '先定位薄弱知识链，再做专题突破。',
    advice: '先对齐目标，再给孩子可完成的小任务。',
  },
  high: {
    diagnosis: '先看大学与专业匹配度，再看单科提分路径。',
    plan: '高考规划以院校-专业-就业主线输出，避免中考化。',
    'study-plan': '时间紧，任务要少而准，每周必须复盘调整。',
    knowledge: '知识点学习直接服务选科和高考题型能力。',
    advice: '尊重孩子选择，家长负责节奏和资源支持。',
  },
};

export function getInternalMaterialContext(input: {
  stageSlug: StageSlug;
  module: InternalModuleKey;
  limit?: number;
}): string {
  const { stageSlug, module, limit = 10 } = input;
  const lines = [...COMMON_MATERIALS, ...(STAGE_MATERIALS[stageSlug] || []), ...(MODULE_RULES[module] || [])];
  return lines.slice(0, limit).map((line, index) => `${index + 1}. ${line}`).join('\n');
}

export function getInternalScriptAnchor(stageSlug: StageSlug, module: InternalModuleKey): string {
  return SCRIPT_ANCHOR[stageSlug][module];
}

export function getObjectionHandlingMaterial(limit = 8): string {
  return OBJECTION_HANDLING_DOC.slice(0, limit)
    .map((line, index) => `${index + 1}. ${line}`)
    .join('\n');
}
