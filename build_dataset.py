# -*- coding: utf-8 -*-
import json
import os

# 1. i-adjectives (From Page 1 of Adjectivs.pdf)
# Columns: Kanji, Furigana, Meaning
i_adjectives_raw = [
    # Column 1
    ("青い", "あおい", "blue"),
    ("赤い", "あかい", "red"),
    ("明るい", "あかるい", "bright"),
    ("温かい", "あたたかい", "warm"),
    ("新しい", "あたらしい", "new"),
    ("暑い", "あつい", "hot (weather)"),
    ("厚い", "あつい", "thick"),
    ("危ない", "あぶない", "dangerous"),
    ("甘い", "あまい", "sweet"),
    ("良い", "よい / いい", "good"),
    ("忙しい", "いそがしい", "busy"),
    ("痛い", "いたい", "painful"),
    ("薄い", "うすい", "thin"),
    ("うるさい", "うるさい", "noisy"),
    ("美味しい", "おいしい", "tasty"),
    ("大きい", "おおきい", "big"),
    ("遅い", "おそい", "late, slow"),
    ("重い", "おもい", "heavy"),
    ("面白い", "おもしろい", "interesting"),
    ("辛い", "からい", "hot, spicy"),
    ("軽い", "かるい", "light"),
    ("可愛い", "かわいい", "cute, pretty"),
    ("黄色い", "きいろい", "yellow"),
    ("汚い", "きたない", "dirty"),
    ("暗い", "くらい", "dark"),
    ("黒い", "くろい", "black"),
    ("寒い", "さむい", "cold"),
    ("白い", "しろい", "white"),
    # Column 2
    ("冷たい", "つめたい", "cold"),
    ("強い", "つよい", "strong"),
    ("遠い", "とおい", "far"),
    ("長い", "ながい", "long"),
    ("早い", "はやい", "early"),
    ("速い", "はやい", "fast, quick"),
    ("低い", "ひくい", "low"),
    ("広い", "ひろい", "wide"),
    ("太い", "ふとい", "fat"),
    ("古い", "ふるい", "old"),
    ("欲しい", "ほしい", "want, desire"),
    ("細い", "ほそい", "thin, fine"),
    ("まずい", "まずい", "tasteless"),
    ("丸い", "まるい", "round"),
    ("短い", "みじかい", "short"),
    ("難しい", "むずかしい", "difficult"),
    ("優しい", "やさしい", "kind"),
    ("安い", "やすい", "cheap"),
    ("若い", "わかい", "young"),
    ("涼しい", "すずしい", "pleasant"),
    ("狭い", "せまい", "narrow"),
    ("高い", "たかい", "high, expensive"),
    ("楽しい", "たのしい", "enjoyable"),
    ("小さい", "ちいさい", "small"),
    ("近い", "ちかい", "near, close"),
    ("詰らない", "つまらない", "boring"),
]

# 2. na-adjectives (From Page 2 of Adjectivs.pdf and Page 1 of verbs.pdf)
na_adjectives_raw = [
    # Column 1
    ("好きな", "すきな", "like, favorite"),
    ("結構な", "けっこうな", "enough, fine"),
    ("有名な", "ゆうめいな", "famous"),
    ("きれいな", "きれいな", "beautiful, clean"),
    ("丁寧な", "ていねいな", "polite"),
    ("嫌いな", "きらいな", "dislike, hate"),
    ("静かな", "しずかな", "quiet"),
    ("暇な", "ひまな", "free, idle"),
    ("賑やかな", "にぎやかな", "lively, crowded"),
    ("便利な", "べんりな", "convenient"),
    ("元気な", "げんきな", "healthy, cheerful"),
    ("色々な", "いろいろな", "various"),
    ("特別な", "とくべつな", "special"),
    ("熱心な", "ねっしんな", "enthusiastic, eager"),
    ("必要な", "ひつような", "necessary"),
    ("まじめな", "まじめな", "serious, earnest"),
    ("真直ぐな", "まっすぐな", "straight"),
    ("立派な", "りっぱな", "splendid"),
    # Column 2
    ("大丈夫な", "だいじょうぶな", "okay, fine"),
    ("丈夫な", "じょうぶな", "healthy, robust"),
    ("大変な", "たいへんな", "terrible"),
    ("楽な", "らくな", "comfortable"),
    ("いやな", "いやな", "unpleasant"),
    ("大切な", "たいせつな", "important"),
    ("上手な", "じょうずな", "good at"),
    ("下手な", "へたな", "bad at"),
    ("一所懸命な", "いっしょけんめいな", "sincerely"),
    ("危険な", "きけんな", "dangerous"),
    ("残念な", "ざんねんな", "regrettable"),
    ("心配な", "しんぱいな", "worry"),
    ("自由な", "じゆうな", "free, independent"),
    ("十分な", "じゅうぶんな", "sufficient"),
    ("大好きな", "だいすきな", "passionate"),
    ("適当な", "てきとうな", "proper, suitable"),
    ("無理な", "むりな", "impossible"),
]

# 3. Verbs with all 6 conjugation forms directly from PDF
# Format: (Dictionary/Kana, Kanji, Meaning, SubCategory, Type, [masu, nai, te, ta, tai, takunai])
verbs_raw = [
    # Page 2: ~う (Godan)
    ("あう", "会う", "To meet", "~う", "godan", ["あいます", "あわない", "あって", "あった", "あいたい", "あいたくない"]),
    ("かう", "買う", "To buy", "~う", "godan", ["かいます", "かわない", "かって", "かった", "かいたい", "かいたくない"]),
    ("つかう", "使う", "To use", "~う", "godan", ["つかいます", "つかわない", "つかって", "つかった", "つかいたい", "つかいたくない"]),
    ("あらう", "洗う", "To wash", "~う", "godan", ["あらいます", "あらわない", "あらって", "あらった", "あらいたい", "あらいたくない"]),
    ("ならう", "習う", "To learn", "~う", "godan", ["ならいます", "ならわない", "ならって", "ならった", "ならいたい", "ならいたくない"]),
    ("はらう", "払う", "To pay", "~う", "godan", ["はらいます", "はらわない", "はらって", "はらった", "はらいたい", "はらいたくない"]),
    ("うたう", "歌う", "To sing", "~う", "godan", ["うたいます", "うたわない", "うたって", "うたった", "うたいたい", "うたいたくない"]),
    ("わらう", "笑う", "To laugh", "~う", "godan", ["わらいます", "わらわない", "わらって", "わらった", "わらいたい", "わらいたくない"]),
    ("いう", "言う", "To say", "~う", "godan", ["いいます", "いわない", "いって", "いった", "いいたい", "いいたくない"]),
    ("ちがう", "違う", "To differ", "~う", "godan", ["ちがいます", "ちがわない", "ちがって", "ちがった", "ちがいたい", "ちがいたくない"]),
    ("もらう", "貰う", "To receive", "~う", "godan", ["もらいます", "もらわない", "もらって", "もらった", "もらいたい", "もらいたくない"]),
    ("すう", "吸う", "To smoke", "~う", "godan", ["すいます", "すわない", "すって", "すった", "すいたい", "すいたくない"]),
    ("てつだう", "手伝う", "To help", "~う", "godan", ["てつだいます", "てつだわない", "てつだって", "てつだった", "てつだいたい", "てつだいたくない"]),

    # Page 2 & Page 3: ~く・ぐ (Godan)
    ("かく", "書く", "To write", "~く・ぐ", "godan", ["かきます", "かかない", "かいて", "かいた", "かきたい", "かきたくない"]),
    ("きく", "聞く", "To listen", "~く・ぐ", "godan", ["ききます", "きかない", "きいて", "きいた", "ききたい", "ききたくない"]),
    ("さく", "咲く", "To bloom", "~く・ぐ", "godan", ["さきます", "さかない", "さいて", "さいた", "さきたい", "さきたくない"]),
    ("あるく", "歩く", "To walk", "~く・ぐ", "godan", ["あるきます", "あるかない", "あるいて", "あるいた", "あるきたい", "あるきたくない"]),
    ("みがく", "磨く", "To brush", "~く・ぐ", "godan", ["みがきます", "みがかない", "みがいて", "みがいた", "みがきたい", "みがきたくない"]),
    ("はたらく", "働く", "To work", "~く・ぐ", "godan", ["はたらきます", "はたらかない", "はたらいて", "はたらいた", "はたらきたい", "はたらきたくない"]),
    ("あく", "開く", "To be opened", "~く・ぐ", "godan", ["あきます", "あかない", "あいて", "あいた", "あきたい", "あきたくない"]),
    ("ひく", "引く", "To pull, to play", "~く・ぐ", "godan", ["ひきます", "ひかない", "ひいて", "ひいた", "ひきたい", "ひきたくない"]),
    ("なく", "泣く", "To cry", "~く・ぐ", "godan", ["なきます", "なかない", "ないて", "ないた", "なきたい", "なきたくない"]),
    ("おく", "置く", "To keep", "~く・ぐ", "godan", ["おきます", "おかない", "おいて", "おいた", "おきたい", "おきたくない"]),
    ("いく", "行く", "To go", "~く・ぐ", "godan", ["いきます", "いかない", "いって", "いった", "いきたい", "いきたくない"]),
    ("ふく", "拭く", "To wipe", "~く・ぐ", "godan", ["ふきます", "ふかない", "ふいて", "ふいた", "ふきたい", "ふきたくない"]),
    ("ふく", "吹く", "To blow", "~く・ぐ", "godan", ["ふきます", "ふかない", "ふいて", "ふいた", "ふきたい", "ふきたくない"]),
    ("およぐ", "泳ぐ", "To swim", "~く・ぐ", "godan", ["およぎます", "およがない", "およいで", "およいだ", "およぎたい", "およぎたくない"]),
    ("ぬぐ", "脱ぐ", "To take off", "~く・ぐ", "godan", ["ぬぎます", "ぬがない", "ぬいで", "ぬいだ", "ぬぎたい", "ぬぎたくない"]),

    # Page 3: ~す (Godan)
    ("はなす", "話す", "To speak", "~す", "godan", ["はなします", "はなさない", "はなして", "はなした", "はなしたい", "はなしたくない"]),
    ("かえす", "返す", "To return", "~す", "godan", ["かえします", "かえさない", "かえして", "かえした", "かえしたい", "かえしたくない"]),
    ("だす", "出す", "To take out", "~す", "godan", ["だします", "ださない", "だして", "だした", "だしたい", "だしたくない"]),
    ("なおす", "直す", "To correct", "~す", "godan", ["なおします", "なおさない", "なおして", "なおした", "なおしたい", "なおしたくない"]),
    ("けす", "消す", "To rub, switch off", "~す", "godan", ["けします", "けさない", "けして", "けした", "けしたい", "けしたくない"]),
    ("わかす", "沸かす", "To boil", "~す", "godan", ["わかします", "わかさない", "わかして", "わかした", "わかしたい", "わかしたくない"]),
    ("さす", "差す", "To point out", "~す", "godan", ["さします", "ささない", "さして", "さした", "さしたい", "さしたくない"]),
    ("わたす", "渡す", "To hand over", "~す", "godan", ["わたします", "わたさない", "わたして", "わたした", "わたしたい", "わたしたくない"]),
    ("おす", "押す", "To push", "~す", "godan", ["おします", "おさない", "おして", "おした", "おしたい", "おしたくない"]),
    ("かす", "貸す", "To lend", "~す", "godan", ["かします", "かさない", "かして", "かした", "かしたい", "かしたくない"]),

    # Page 3 & Page 4: ~つ (Godan)
    ("まつ", "待つ", "To wait", "~つ", "godan", ["まちます", "またない", "まって", "まった", "まちたい", "まちたくない"]),
    ("もつ", "持つ", "To hold", "~つ", "godan", ["もちます", "もたない", "もって", "もった", "もちたい", "もちたくない"]),
    ("たつ", "立つ", "To stand", "~つ", "godan", ["たちます", "たたない", "たって", "たった", "たちたい", "たちたくない"]),
    ("かつ", "勝つ", "To win", "~つ", "godan", ["かちます", "かたない", "かって", "かった", "かちたい", "かちたくない"]),
    ("うつ", "打つ", "To strike", "~つ", "godan", ["うちます", "うたない", "うって", "うった", "うちたい", "うちたくない"]),
    ("そだつ", "育つ", "To be grown", "~つ", "godan", ["そだちます", "そだたない", "そだって", "そだった", "そだちたい", "そだちたくない"]),

    # Page 4: ~ぬ・む・ぶ (Godan)
    ("しぬ", "死ぬ", "To die", "~ぬ・む・ぶ", "godan", ["しにます", "しなない", "しんで", "しんだ", "しにたい", "しにたくない"]),
    ("よむ", "読む", "To read", "~ぬ・む・ぶ", "godan", ["よみます", "よまない", "よんで", "よんだ", "よみたい", "よみたくない"]),
    ("のむ", "飲む", "To drink", "~ぬ・む・ぶ", "godan", ["のみます", "のまない", "のんで", "のんだ", "のみたい", "のみたくない"]),
    ("やすむ", "休む", "To rest", "~ぬ・む・ぶ", "godan", ["やすみます", "やすまない", "やすんで", "やすんだ", "やすみたい", "やすみたくない"]),
    ("すむ", "住む", "To stay", "~ぬ・む・ぶ", "godan", ["すみます", "すまない", "すんで", "すんだ", "すみたい", "すみたくない"]),
    ("たのむ", "頼む", "To request", "~ぬ・む・ぶ", "godan", ["たのみます", "たのまない", "たのんで", "たのんだ", "たのみたい", "たのみたくない"]),
    ("すすむ", "進む", "To advance", "~ぬ・む・ぶ", "godan", ["すすみます", "すすまない", "すすんで", "すすんだ", "すすみたい", "すすみたくない"]),
    ("ぬすむ", "盗む", "To steal", "~ぬ・む・ぶ", "godan", ["ぬすみます", "ぬすまない", "ぬすんで", "ぬすんだ", "ぬすみたい", "ぬすみたくない"]),
    ("あそぶ", "遊ぶ", "To enjoy,play", "~ぬ・む・ぶ", "godan", ["あそびます", "あそばない", "あそんで", "あそんだ", "あそびたい", "あそびたくない"]),
    ("とぶ", "飛ぶ", "To fly", "~ぬ・む・ぶ", "godan", ["とびます", "とばない", "とんで", "とんだ", "とびたい", "とびたくない"]),
    ("まなぶ", "学ぶ", "To learn", "~ぬ・む・ぶ", "godan", ["まなびます", "まなばない", "まなんで", "まなんだ", "まなびたい", "まなびたくない"]),
    ("よぶ", "呼ぶ", "To call", "~ぬ・む・ぶ", "godan", ["よびます", "よばない", "よんで", "よんだ", "よびたい", "よびたくない"]),
    ("はこぶ", "運ぶ", "To carry", "~ぬ・む・ぶ", "godan", ["はこびます", "はこばない", "はこんで", "はこんだ", "はこびたい", "はこびたくない"]),
    ("よろこぶ", "喜ぶ", "To be glad", "~ぬ・む・ぶ", "godan", ["よろこびます", "よろこばない", "よろこんで", "よろこんだ", "よろこびたい", "よろこびたくない"]),

    # Page 4 & Page 5: ~る (Godan)
    ("はしる", "走る", "To run", "~る", "godan", ["はしります", "はしらない", "はしって", "はしった", "はしりたい", "はしりたくない"]),
    ("きる", "切る", "To cut", "~る", "godan", ["きります", "きらない", "きって", "きった", "きりたい", "きりたくない"]),
    ("わかる", "分かる", "To understand", "~る", "godan", ["わかります", "わからない", "わかって", "わかった", "わかりたい", "わかりたくない"]),
    ("かえる", "帰る", "To return", "~る", "godan", ["かえります", "かえらない", "かえって", "かえった", "かえりたい", "かえりたくない"]),
    ("がんばる", "頑張る", "To try", "~る", "godan", ["がんばります", "がんばらない", "がんばって", "がんばった", "がんばりたい", "がんばりたくない"]),
    ("はいる", "入る", "To enter", "~る", "godan", ["はいります", "はいらない", "はいって", "はいった", "はいりたい", "はいりたくない"]),
    ("しる", "知る", "To know", "~る", "godan", ["しります", "しらない", "しって", "しった", "しりたい", "しりたくない"]),
    ("おわる", "終わる", "To be over", "~る", "godan", ["おわります", "おわらない", "おわって", "おわった", "おわりたい", "おわりたくない"]),
    ("あがる", "上がる", "To rise", "~る", "godan", ["あがります", "あがらない", "あがって", "あがった", "あがりたい", "あがりたくない"]),
    ("とる", "取る", "To take", "~る", "godan", ["とります", "とらない", "とって", "とった", "とりたい", "とりたくない"]),
    ("つくる", "作る", "To make", "~る", "godan", ["つくります", "つくらない", "つくって", "つくった", "つくりたい", "つくりたくない"]),
    ("とまる", "止まる", "To be stopped", "~る", "godan", ["とまります", "とまらない", "とまって", "とまった", "とまりたい", "とまりたくない"]),
    ("さがる", "下がる", "To be decreased", "~る", "godan", ["さがります", "さがらない", "さがって", "さがった", "さがりたい", "さがりたくない"]),
    ("かかる", "掛かる", "To require", "~る", "godan", ["かかります", "かからない", "かかって", "かかった", "かかりたい", "かかりたくない"]),
    ("なる", "成る", "To become", "~る", "godan", ["なります", "ならない", "なって", "なった", "なりたい", "なりたくない"]),
    ("ふる", "降る", "To fall (rain, snow)", "~る", "godan", ["ふります", "ふらない", "ふって", "ふった", "ふりたい", "ふりたくない"]),
    ("おこる", "怒る", "be angry", "~る", "godan", ["おこります", "おこらない", "おこって", "おこった", "おこりたい", "おこりたくない"]),
    ("のる", "乗る", "get in To,get on", "~る", "godan", ["のります", "のらない", "のって", "のった", "のりたい", "のりたくない"]),
    ("やる", "遣る", "To play", "~る", "godan", ["やります", "やらない", "やって", "やった", "やりたい", "やりたくない"]),
    ("そる", "剃る", "To shave", "~る", "godan", ["そります", "そらない", "そって", "そった", "そりたい", "そりたくない"]),
    ("すわる", "座る", "To sit", "~る", "godan", ["すわります", "すわらない", "すわって", "すわった", "すわりたい", "すわりたくない"]),
    ("かぶる", "被る", "To put on (cap)", "~る", "godan", ["かぶります", "かぶらない", "かぶって", "かぶった", "かぶりたい", "かぶりたくない"]),
    ("うる", "売る", "To sell", "~る", "godan", ["うります", "うらない", "うって", "うった", "うりたい", "うりたくない"]),
    ("とおる", "通る", "To pass by", "~る", "godan", ["とおります", "とおらない", "とおって", "とおった", "とおりたい", "とおりたくない"]),
    ("おどる", "踊る", "To dance", "~る", "godan", ["おどります", "おどらない", "おどって", "おどった", "おどりたい", "おどりたくない"]),
    ("わたる", "渡る", "To cross", "~る", "godan", ["わたります", "わたらない", "わたって", "わたった", "わたりたい", "わたりたくない"]),
    ("まがる", "曲がる", "To turn", "~る", "godan", ["まがります", "まがらない", "まがって", "まがった", "まがりたい", "まがりたくない"]),
    ("はる", "貼る", "To paste", "~る", "godan", ["はります", "はらない", "はって", "はらった", "はりたい", "はりたくない"]),
    ("のぼる", "登る", "To climb", "~る", "godan", ["のぼります", "のぼらない", "のぼって", "のぼった", "のぼりたい", "のぼりたくない"]),

    # Page 6: いちだんどうし - TYPE II Verbs (Ichidan)
    ("たべる", "食べる", "To eat", "TYPE II", "ichidan", ["たべます", "たべない", "たべて", "たべた", "たべたい", "たべたくない"]),
    ("みる", "見る", "To see", "TYPE II", "ichidan", ["みます", "みない", "みて", "みた", "みたい", "みたくない"]),
    ("あける", "開ける", "To open", "TYPE II", "ichidan", ["あけます", "あけない", "あけて", "あけた", "あけたい", "あけたくない"]),
    ("はじめる", "始める", "To start", "TYPE II", "ichidan", ["はじめます", "はじめない", "はじめて", "はじめた", "はじめたい", "はじめたくない"]),
    ("ねる", "寝る", "To sleep", "TYPE II", "ichidan", ["ねます", "ねない", "ねて", "ねた", "ねたい", "ねたくない"]),
    ("おきる", "起きる", "To get up", "TYPE II", "ichidan", ["おきます", "おきない", "おきて", "おきた", "おきたい", "おきたくない"]),
    ("おしえる", "教える", "To teach", "TYPE II", "ichidan", ["おしえます", "おしえない", "おしえて", "おしえた", "おしえたい", "おしえたくない"]),
    ("かんがえる", "考える", "To think", "TYPE II", "ichidan", ["かんがえます", "かんがえない", "かんがえて", "かんがえた", "かんがえたい", "かんがえたくない"]),
    ("うまれる", "生まれる", "To born", "TYPE II", "ichidan", ["うまれます", "うまれない", "うまれて", "うまれた", "うまれたい", "うまれたくない"]),
    ("おぼえる", "覚える", "To remember", "TYPE II", "ichidan", ["おぼえます", "おぼえない", "おぼえて", "おぼえた", "おぼえたい", "おぼえたくない"]),
    ("きる", "着る", "To wear", "TYPE II", "ichidan", ["きます", "きない", "きて", "きた", "きたい", "きたくない"]),
    ("こたえる", "答える", "To answer", "TYPE II", "ichidan", ["こたえます", "こたえない", "こたえて", "こたえた", "こたえたい", "こたえたくない"]),
    ("たすける", "助ける", "To help", "TYPE II", "ichidan", ["たすけます", "たすけない", "たすけて", "たすけた", "たすけたい", "たすけたくない"]),
    ("わすれる", "忘れる", "To forget", "TYPE II", "ichidan", ["わすれます", "わすれない", "わすれて", "わすれた", "わすれたい", "わすれたくない"]),
    ("でる", "出る", "To go out", "TYPE II", "ichidan", ["でます", "でない", "でて", "でた", "でたい", "でたくない"]),
    ("みせる", "見せる", "To show", "TYPE II", "ichidan", ["みせます", "みせない", "みせて", "みせた", "みせたい", "みせたくない"]),
    ("いる", "居る", "To be", "TYPE II", "ichidan", ["います", "いない", "いて", "いた", "いたい", "いたくない"]),
    ("かえる", "変える", "To change", "TYPE II", "ichidan", ["かえます", "かえない", "かえて", "かえた", "かえたい", "かえたくない"]),
    ("あびる", "浴びる", "To take shower", "TYPE II", "ichidan", ["あびます", "あびない", "あびて", "あびた", "あびたい", "あびたくない"]),
    ("おりる", "降りる", "To get down", "TYPE II", "ichidan", ["おります", "おりない", "おりて", "おりた", "おりたい", "おりたくない"]),
    ("しめる", "閉める", "To close (door)", "TYPE II", "ichidan", ["しめます", "しめない", "しめて", "しめた", "しめたい", "しめたくない"]),
    ("とじる", "閉じる", "To close (book)", "TYPE II", "ichidan", ["とじます", "とじない", "とじて", "とじた", "とじたい", "とじたくない"]),
    ("できる", "出来る", "To be able", "TYPE II", "ichidan", ["できます", "できない", "できて", "できた", "できたい", "できたくない"]),
    ("おちる", "落ちる", "To fall", "TYPE II", "ichidan", ["おちます", "おちない", "おちて", "おちた", "おちたい", "おちたくない"]),

    # Page 7: TYPE II Continued
    ("でかける", "出かける", "To go out", "TYPE II", "ichidan", ["でかけます", "でかけない", "でかけて", "でかけた", "でかけたい", "でかけたくない"]),
    ("はれる", "晴れる", "To clear up", "TYPE II", "ichidan", ["はれます", "はれない", "はれて", "はれた", "はれたい", "はれたくない"]),

    # Page 7: ふきそくどうし - Irregular Verbs
    ("くる", "来る", "To come", "Irregular", "irregular", ["きます", "こない", "きて", "きた", "きたい", "きたくない"]),
    ("する", "する", "To do", "Irregular", "irregular", ["します", "しない", "して", "した", "したい", "したくない"]),
]

# Kana to Romaji helper table
KANA_MAP = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
}

def kana_to_romaji(text):
    text = text.replace(' ', '').replace('/', ' / ')
    res = []
    i = 0
    parts = text.split(' / ')
    final_parts = []
    for part in parts:
        p_res = ""
        j = 0
        while j < len(part):
            # double consonant for っ
            if part[j] == 'っ' and j + 1 < len(part):
                next_rom = kana_to_romaji(part[j+1])
                if next_rom:
                    p_res += next_rom[0]
                j += 1
                continue
            if j + 1 < len(part) and part[j:j+2] in KANA_MAP:
                p_res += KANA_MAP[part[j:j+2]]
                j += 2
                continue
            if part[j] in KANA_MAP:
                p_res += KANA_MAP[part[j]]
                j += 1
                continue
            p_res += part[j]
            j += 1
        final_parts.append(p_res)
    return " / ".join(final_parts)

items = []
current_id = 1

# Process i-adjectives
for kanji, furigana, meaning in i_adjectives_raw:
    # If kanji is same as furigana (like うるさい, まずい)
    display_kanji = kanji
    romaji = kana_to_romaji(furigana)
    # Adjective conjugations
    # stem
    stem = furigana[:-1] if furigana.endswith('い') and furigana != 'よい / いい' else furigana
    conjs = {}
    if furigana == 'よい / いい':
        conjs = {
            "plain": "いい / よい",
            "negative": "よくない",
            "past": "よかった",
            "past_negative": "よくなかった",
            "te_form": "よくて",
            "adverb": "よく"
        }
    elif furigana.endswith('い'):
        conjs = {
            "plain": furigana,
            "negative": stem + "くない",
            "past": stem + "かった",
            "past_negative": stem + "くなかった",
            "te_form": stem + "くて",
            "adverb": stem + "く"
        }

    items.append({
        "id": f"i_adj_{current_id:03d}",
        "type": "i-adjective",
        "categoryLabel": "い-Adjective",
        "kanji": display_kanji,
        "furigana": furigana,
        "romaji": romaji,
        "meaning": meaning,
        "conjugations": conjs,
        "jlptLevel": "N5"
    })
    current_id += 1

# Process na-adjectives
current_id = 1
for kanji, furigana, meaning in na_adjectives_raw:
    romaji = kana_to_romaji(furigana)
    # stem is furigana without な
    stem = furigana[:-1] if furigana.endswith('な') else furigana
    k_stem = kanji[:-1] if kanji.endswith('な') else kanji
    conjs = {
        "noun_modifier": furigana,
        "plain_affirmative": stem + "だ",
        "plain_negative": stem + "じゃない",
        "polite_affirmative": stem + "です",
        "polite_negative": stem + "じゃないです / ではありません",
        "past": stem + "だった",
        "te_form": stem + "で"
    }

    items.append({
        "id": f"na_adj_{current_id:03d}",
        "type": "na-adjective",
        "categoryLabel": "な-Adjective",
        "kanji": kanji,
        "furigana": furigana,
        "romaji": romaji,
        "meaning": meaning,
        "conjugations": conjs,
        "jlptLevel": "N5"
    })
    current_id += 1

# Process verbs
current_id = 1
for kana, kanji, meaning, subCat, vtype, forms in verbs_raw:
    masu, nai, te, ta, tai, takunai = forms
    romaji = kana_to_romaji(kana)

    catLabel = "Godan (Group 1)" if vtype == "godan" else ("Ichidan (Group 2)" if vtype == "ichidan" else "Irregular (Group 3)")

    items.append({
        "id": f"verb_{current_id:03d}",
        "type": f"{vtype}-verb",
        "categoryLabel": f"Verb • {catLabel}",
        "group": vtype,
        "subCategory": subCat,
        "kanji": kanji,
        "furigana": kana,
        "romaji": romaji,
        "meaning": meaning,
        "conjugations": {
            "dictionary": kana,
            "masu": masu,
            "nai": nai,
            "te": te,
            "ta": ta,
            "tai": tai,
            "takunai": takunai
        },
        "conjugationLabels": {
            "dictionary": "辞書形 (Dictionary / Plain)",
            "masu": "～ます (Polite Affirmative)",
            "nai": "～ない (Plain Negative)",
            "te": "～て (Te-form / Request)",
            "ta": "～た (Past Plain)",
            "tai": "～たい (Want to / Desire)",
            "takunai": "～たくない (Don't want to)"
        },
        "jlptLevel": "N5"
    })
    current_id += 1

os.makedirs("src", exist_ok=True)
with open("src/data.js", "w", encoding="utf-8") as f:
    f.write("// JLPT N5 Master Vocabulary & Conjugation Dataset\n")
    f.write("// Extracted directly from AtoJ Hirameki Japanese Language Classes study material\n\n")
    f.write("export const JLPT_DATA = ")
    json.dump(items, f, ensure_ascii=False, indent=2)
    f.write(";\n\n")

    # Add quick summary stats
    f.write("export const DATA_STATS = {\n")
    f.write(f"  total: {len(items)},\n")
    f.write(f"  iAdjectives: {len(i_adjectives_raw)},\n")
    f.write(f"  naAdjectives: {len(na_adjectives_raw)},\n")
    f.write(f"  verbs: {len(verbs_raw)}\n")
    f.write("};\n")

print(f"Generated data.js with {len(items)} items: {len(i_adjectives_raw)} i-adj, {len(na_adjectives_raw)} na-adj, {len(verbs_raw)} verbs.")
