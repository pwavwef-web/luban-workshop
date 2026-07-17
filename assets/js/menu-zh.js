/*
 * Chinese localization for menu items, keyed by item id.
 * Names mirror the curated `nameZh` in data/menu-catalog.json; descriptions are
 * localized here (the catalog has no description field). Applied client-side on
 * the chinese/ pages — any id not present here falls back to the English text,
 * so newly added dishes degrade gracefully until translated.
 */
(function () {
  window.MENU_ZH = {
    SP1: { name: '鸡肉玉米羹', description: '嫩滑鸡肉与甜玉米熬制的顺滑鲜香靓汤' },
    SP2: { name: '酸辣汤', description: '加入豆腐与蔬菜的传统中式酸辣汤' },
    S1: { name: '牛肉春卷 (3件)', description: '香脆春卷，包裹调味牛肉馅' },
    S2: { name: '蔬菜春卷 (3件)', description: '香脆春卷，包裹新鲜时蔬' },
    S3: { name: '牛肉三角酥 (5件)', description: '金黄酥炸三角酥，内馅为香辣牛肉' },
    S4: { name: '鱼肉三角酥 (5件)', description: '金黄酥炸三角酥，内馅为调味鱼肉' },
    S5: { name: '炸鸡块 (6件)', description: '香脆炸鸡块，调味恰到好处' },
    S6: { name: '特色鸡翅', description: '香脆鸡翅，佐以我们的特制调味' },
    S7: { name: '黄金炸虾', description: '金黄酥脆的炸虾，配蘸酱' },
    S8: { name: '椒盐鱿鱼', description: '椒盐调味、外酥里嫩的鱿鱼' },
    B1: { name: '青椒洋葱炒牛肉丝', description: '青椒洋葱与嫩牛肉丝同炒，酱香浓郁' },
    B2: { name: '四川辣汁牛肉', description: '香辣四川酱汁烹制的牛肉片' },
    B3: { name: '咖喱牛肉片', description: '浓郁咖喱汁烧制的嫩牛肉片' },
    B4: { name: '蚝油牛肉', description: '蚝油慢烧、鲜嫩多汁的牛肉' },
    B5: { name: '香辣脆牛肉', description: '香脆牛肉条裹上酸辣酱汁' },
    B6: { name: '蒙古葱爆羊肉', description: '蒙古风味，嫩羊肉与青葱同炒' },
    B7: { name: '羊排', description: '香草与香料烤制的羊排' },
    P1: { name: '糖醋里脊', description: '经典糖醋里脊，配彩椒与菠萝' },
    P2: { name: '四川风味猪肉', description: '浓烈香辣四川酱汁烹制的猪肉' },
    P3: { name: '辣汁猪肉', description: '火辣辣汁烧制的嫩猪肉' },
    P4: { name: '蚝油猪肉', description: '蚝油浓香、咸鲜可口的猪肉' },
    P5: { name: '炸猪排骨', description: '香脆炸猪排骨，调味入味' },
    K1: { name: '糖醋鸡', description: '香脆鸡肉裹经典糖醋酱汁' },
    K2: { name: '四川辣汁鸡', description: '香辣四川酱汁烹制的嫩鸡肉' },
    K3: { name: '咖喱鸡', description: '香浓咖喱汁烧制的多汁鸡肉' },
    K4: { name: '蚝油鸡', description: '蚝油浓香、鲜嫩多汁的鸡肉' },
    Q1: { name: '鲁班辣汁鱿鱼', description: '嫩鱿鱼裹上鲁班招牌辣酱' },
    Q2: { name: '四川辣汁鱿鱼', description: '浓郁四川酱汁烹制的鱿鱼' },
    Q3: { name: '蒜汁鱿鱼', description: '蒜香浓郁的鱿鱼' },
    F1: { name: '辣汁鱼片', description: '火辣辣汁烹制的嫩鱼片' },
    F2: { name: '蔬菜汁鱼片', description: '与新鲜时蔬同烹的鱼片' },
    F3: { name: '四川辣汁鱼片', description: '香辣四川酱汁烹制的鱼片' },
    F4: { name: '糖醋鱼片', description: '糖醋酱汁烹制的嫩鱼片' },
    PR1: { name: '辣汁大虾', description: '香辣辣汁烹制的鲜嫩大虾' },
    PR2: { name: '咖喱大虾', description: '香浓咖喱汁烹制的多汁大虾' },
    PR3: { name: '四川辣汁大虾', description: '浓郁四川酱汁烹制的大虾' },
    SF1: { name: '四川辣汁特色海鲜', description: '招牌四川酱汁烹制的精选海鲜' },
    R1: { name: '白饭', description: '清香白米饭' },
    R2: { name: '特色番茄炒饭', description: '以特制香料烹煮、香气四溢的西非风味炒饭（Jollof）' },
    R3: { name: '招牌炒饭', description: '招牌炒饭，蔬菜与肉类搭配' },
    R4: { name: '虾仁炒饭', description: '加入鲜嫩虾仁的炒饭' },
    R5: { name: '蛋炒饭', description: '经典蛋炒饭' },
    R6: { name: '牛肉炒饭', description: '加入嫩牛肉的炒饭' },
    R7: { name: '鸡肉炒饭', description: '加入多汁鸡肉的炒饭' },
    R8: { name: '海鲜炒饭', description: '什锦新鲜海鲜炒饭' },
    R9: { name: '猪肉炒饭', description: '加入猪肉的炒饭' },
    N1: { name: '蔬菜炒面', description: '新鲜时蔬爆炒面' },
    N2: { name: '特色炒面', description: '我们的特色面，搭配多种肉类与蔬菜' },
    N4: { name: '星洲炒米', description: '星洲炒米，虾仁、猪肉与蔬菜佐咖喱' },
    N5: { name: '海鲜面', description: '面条搭配丰盛的新鲜海鲜' },
    N6: { name: '鸡肉炒面', description: '与嫩鸡肉同炒的面' },
    D1: { name: '蒸猪肉饺', description: '手工蒸饺，调味猪肉馅' },
    D2: { name: '煎猪肉饺', description: '香脆煎饺，调味猪肉馅' },
    D3: { name: '蒸牛肉饺', description: '手工蒸饺，调味牛肉馅' },
    D4: { name: '煎牛肉饺', description: '香脆煎饺，调味牛肉馅' },
    V1: { name: '什锦蔬菜', description: '鲜香酱汁烹制的什锦时蔬' },
    DR1: { name: '可口可乐 (300毫升)', description: '清爽可口可乐 300毫升瓶装' },
    DR2: { name: '芬达 (300毫升)', description: '清爽芬达 300毫升瓶装' },
    DR3: { name: '雪碧 (300毫升)', description: '清爽雪碧 300毫升瓶装' },
    DR4: { name: '瓶装水 (300毫升)', description: '300毫升瓶装矿泉水' }
  };

  /**
   * Localize a menu item object in place (or return a localized shallow copy).
   * Unknown ids are returned unchanged so English text remains as a fallback.
   */
  window.localizeMenuItemZh = function (item) {
    if (!item || !item.id) return item;
    var zh = window.MENU_ZH[item.id];
    if (!zh) return item;
    if (zh.name) item.name = zh.name;
    if (zh.description) item.description = zh.description;
    return item;
  };
}());
