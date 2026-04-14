export type FoodType = '地域美食' | '荤素套餐' | '连锁品牌' | '轻食素食'
export type FoodSpicyLevel = '辣' | '不辣'
export type FoodMealCategory = '快餐' | '正餐' | '小吃' | '轻食'
export type FoodPriceRangeKey = 'all' | '0-25' | '25-45' | '45+'

export interface FoodItem {
  id: string
  type: FoodType
  name: string
  desc: string
  icon: string
  img: string
  category: string
  spicyLevel: FoodSpicyLevel
  mealCategory: FoodMealCategory
  price: number
}

interface FoodSeed {
  type: FoodType
  name: string
  desc: string
  icon: string
  category: string
  keyword: string
}

const buildFoodImage = (keyword: string): string => {
  return `https://source.unsplash.com/1280x960/?${encodeURIComponent(`${keyword},food,close-up,delicious`)}`
}

const FOOD_SEEDS: FoodSeed[] = [
  { type: '地域美食', category: '川渝', name: '麻辣火锅', desc: '牛油锅底配毛肚鸭血，麻辣鲜香太上头', icon: '🍲', keyword: 'hotpot' },
  { type: '地域美食', category: '川渝', name: '钵钵鸡', desc: '红油香辣裹满鸡肉串，越吃越开胃', icon: '🍢', keyword: 'spicy chicken skewers' },
  { type: '地域美食', category: '川渝', name: '回锅肉盖饭', desc: '豆瓣酱爆香五花肉，配米饭很满足', icon: '🍛', keyword: 'twice cooked pork rice' },
  { type: '地域美食', category: '川渝', name: '担担面', desc: '芝麻酱与红油交织，麻辣浓香有层次', icon: '🍜', keyword: 'dan dan noodles' },
  { type: '地域美食', category: '川渝', name: '冷吃兔', desc: '麻辣干香，越嚼越有味道', icon: '🥘', keyword: 'spicy rabbit cuisine' },
  { type: '地域美食', category: '川渝', name: '酸辣粉', desc: '红薯粉爽滑弹牙，酸辣开胃超解馋', icon: '🍜', keyword: 'hot and sour noodles' },
  { type: '地域美食', category: '川渝', name: '冒菜双拼', desc: '荤素一锅端，汤汁浓郁有灵魂', icon: '🥗', keyword: 'mala bowl' },
  { type: '地域美食', category: '川渝', name: '辣子鸡丁', desc: '干辣椒爆香鸡丁，酥脆香辣超下饭', icon: '🍗', keyword: 'spicy diced chicken' },

  { type: '地域美食', category: '江浙', name: '蟹黄汤包', desc: '轻轻一咬爆汁鲜甜，汤底浓郁顺口', icon: '🥟', keyword: 'crab soup dumplings' },
  { type: '地域美食', category: '江浙', name: '东坡肉', desc: '肥而不腻，软糯入味，酱香醇厚', icon: '🍖', keyword: 'dongpo pork' },
  { type: '地域美食', category: '江浙', name: '葱油拌面', desc: '葱香浓郁面条筋道，简洁却很惊艳', icon: '🍜', keyword: 'scallion oil noodles' },
  { type: '地域美食', category: '江浙', name: '盐水鸭', desc: '鸭肉咸香细嫩，皮脂香而不腻', icon: '🍗', keyword: 'salted duck' },
  { type: '地域美食', category: '江浙', name: '桂花糖藕', desc: '清甜糯香，午后来一份很治愈', icon: '🍡', keyword: 'lotus root dessert' },
  { type: '地域美食', category: '江浙', name: '苏式焖肉面', desc: '红烧焖肉入口即化，汤面鲜香温润', icon: '🍜', keyword: 'braised pork noodles' },
  { type: '地域美食', category: '江浙', name: '杭帮片儿川', desc: '雪菜笋片加肉片，鲜香浓郁很家常', icon: '🍜', keyword: 'pian er chuan noodles' },
  { type: '地域美食', category: '江浙', name: '宁波海鲜炒年糕', desc: '年糕软糯弹牙，海鲜鲜味十足', icon: '🍤', keyword: 'seafood rice cake stir fry' },

  { type: '地域美食', category: '粤式', name: '叉烧饭', desc: '蜜汁叉烧焦香多汁，配饭刚刚好', icon: '🍛', keyword: 'char siu rice' },
  { type: '地域美食', category: '粤式', name: '虾饺', desc: '水晶皮Q弹透亮，虾仁鲜甜饱满', icon: '🥟', keyword: 'shrimp dumplings dim sum' },
  { type: '地域美食', category: '粤式', name: '云吞面', desc: '汤清味鲜，云吞皮薄馅嫩', icon: '🍜', keyword: 'wonton noodles' },
  { type: '地域美食', category: '粤式', name: '烧腊双拼', desc: '油鸡与叉烧双拼，肉香加倍满足', icon: '🍖', keyword: 'cantonese roast platter' },
  { type: '地域美食', category: '粤式', name: '煲仔饭', desc: '锅巴香脆，腊味油润，米饭粒粒分明', icon: '🍚', keyword: 'claypot rice' },
  { type: '地域美食', category: '粤式', name: '肠粉拼盘', desc: '滑嫩细腻，酱汁鲜甜不腻口', icon: '🥢', keyword: 'rice noodle roll' },
  { type: '地域美食', category: '粤式', name: '豉汁蒸排骨饭', desc: '豆豉咸香入骨，蒸饭软糯有肉汁', icon: '🍖', keyword: 'steamed pork ribs rice' },
  { type: '地域美食', category: '粤式', name: '艇仔粥', desc: '料足味鲜，口感绵滑暖胃', icon: '🥣', keyword: 'cantonese congee' },

  { type: '地域美食', category: '北方', name: '炸酱面', desc: '酱香浓厚，黄瓜丝提鲜爽口', icon: '🍜', keyword: 'zhajiang noodles' },
  { type: '地域美食', category: '北方', name: '驴肉火烧', desc: '外酥里嫩，驴肉喷香扎实', icon: '🥙', keyword: 'donkey meat sandwich' },
  { type: '地域美食', category: '北方', name: '三鲜饺子', desc: '鲜虾木耳韭菜搭配，汁水丰盈', icon: '🥟', keyword: 'dumplings' },
  { type: '地域美食', category: '北方', name: '煎饼果子', desc: '酥脆薄饼包裹多层口感，早餐也能当午餐', icon: '🌯', keyword: 'jianbing' },
  { type: '地域美食', category: '北方', name: '铁锅炖', desc: '肉菜同炖汤浓味厚，锅边贴饼子绝配', icon: '🍲', keyword: 'northeast stew' },
  { type: '地域美食', category: '北方', name: '羊肉泡馍', desc: '馍块吸满肉汤，暖胃又饱腹', icon: '🥣', keyword: 'yangrou paomo' },
  { type: '地域美食', category: '北方', name: '北京烤鸭卷', desc: '鸭皮酥香油润，甜面酱回味足', icon: '🦆', keyword: 'peking duck wrap' },
  { type: '地域美食', category: '北方', name: '锅包肉', desc: '酸甜酥脆，外焦里嫩超下饭', icon: '🍖', keyword: 'sweet sour pork' },

  { type: '地域美食', category: '其他', name: '螺蛳粉', desc: '酸辣鲜香层次拉满，越吃越上瘾', icon: '🍜', keyword: 'luosifen' },
  { type: '地域美食', category: '其他', name: '热干面', desc: '芝麻酱香浓厚，面条劲道爽滑', icon: '🍜', keyword: 'reganmian' },
  { type: '地域美食', category: '其他', name: '肉夹馍', desc: '外脆内香，卤肉软烂有汁', icon: '🥙', keyword: 'roujiamo' },
  { type: '地域美食', category: '其他', name: '兰州拉面', desc: '一清二白三红四绿，汤鲜面劲道', icon: '🍜', keyword: 'lanzhou noodles' },
  { type: '地域美食', category: '其他', name: '新疆炒米粉', desc: '酱香浓郁，米粉Q弹，辣得过瘾', icon: '🍝', keyword: 'xinjiang fried rice noodles' },
  { type: '地域美食', category: '其他', name: '贵州酸汤牛肉粉', desc: '酸香开胃，牛肉嫩滑有嚼劲', icon: '🍲', keyword: 'sour soup beef noodles' },
  { type: '地域美食', category: '其他', name: '海南鸡饭', desc: '鸡肉鲜嫩，油饭喷香，蘸酱很灵魂', icon: '🍗', keyword: 'hainan chicken rice' },
  { type: '地域美食', category: '其他', name: '台式卤肉饭', desc: '卤汁浓郁胶质满满，拌饭一绝', icon: '🍛', keyword: 'braised pork rice' },

  { type: '荤素套餐', category: '家常套餐', name: '可乐鸡翅套餐', desc: '可乐鸡翅 + 清炒时蔬 + 杂粮饭，甜咸平衡', icon: '🍗', keyword: 'cola chicken wings set' },
  { type: '荤素套餐', category: '家常套餐', name: '酸菜鱼套餐', desc: '酸菜鱼 + 拍黄瓜 + 白米饭，酸爽开胃', icon: '🐟', keyword: 'pickled fish set meal' },
  { type: '荤素套餐', category: '家常套餐', name: '烤鸡腿套餐', desc: '烤鸡腿 + 凉拌海带丝 + 手抓饼，咸香丰富', icon: '🍗', keyword: 'roast chicken leg set meal' },
  { type: '荤素套餐', category: '家常套餐', name: '番茄牛腩套餐', desc: '番茄牛腩 + 蒜蓉油麦菜 + 馒头，暖胃耐饱', icon: '🥘', keyword: 'tomato beef brisket set meal' },
  { type: '荤素套餐', category: '家常套餐', name: '黑椒牛柳套餐', desc: '黑椒牛柳 + 清炒西兰花 + 米饭，香气十足', icon: '🥩', keyword: 'black pepper beef set meal' },
  { type: '荤素套餐', category: '家常套餐', name: '香菇滑鸡套餐', desc: '香菇滑鸡 + 凉拌木耳 + 小米饭，鲜嫩有汁', icon: '🍚', keyword: 'mushroom chicken rice set' },
  { type: '荤素套餐', category: '家常套餐', name: '红烧排骨套餐', desc: '红烧排骨 + 蒜蓉菠菜 + 玉米饭，酱香下饭', icon: '🍖', keyword: 'braised ribs set meal' },
  { type: '荤素套餐', category: '家常套餐', name: '照烧鸡排套餐', desc: '照烧鸡排 + 什锦蔬菜 + 糙米饭，口感清爽', icon: '🍱', keyword: 'teriyaki chicken set meal' },
  { type: '荤素套餐', category: '家常套餐', name: '黄焖鸡米饭套餐', desc: '黄焖鸡 + 凉拌青瓜 + 米饭，浓香入味', icon: '🍛', keyword: 'braised chicken rice set' },
  { type: '荤素套餐', category: '家常套餐', name: '宫保鸡丁套餐', desc: '宫保鸡丁 + 炝炒圆白菜 + 米饭，麻辣酸甜', icon: '🍲', keyword: 'kung pao chicken set meal' },
  { type: '荤素套餐', category: '家常套餐', name: '香煎三文鱼套餐', desc: '香煎三文鱼 + 芦笋 + 紫米饭，轻盈有质感', icon: '🐟', keyword: 'grilled salmon set meal' },
  { type: '荤素套餐', category: '家常套餐', name: '土豆炖牛肉套餐', desc: '土豆炖牛肉 + 凉拌西红柿 + 米饭，家常治愈', icon: '🥔', keyword: 'beef potato stew set meal' },

  { type: '连锁品牌', category: 'KFC', name: 'KFC香辣鸡腿堡套餐', desc: '香辣鸡腿堡 + 薯条 + 冰可乐，经典快餐组合', icon: '🍔', keyword: 'kfc spicy chicken burger combo' },
  { type: '连锁品牌', category: 'KFC', name: 'KFC奥尔良烤翅餐', desc: '奥尔良烤翅 + 土豆泥 + 可乐，甜辣平衡', icon: '🍗', keyword: 'kfc wings combo' },
  { type: '连锁品牌', category: 'KFC', name: 'KFC老北京鸡肉卷', desc: '鸡肉卷酱香浓郁，口感扎实满足', icon: '🌯', keyword: 'kfc wrap meal' },
  { type: '连锁品牌', category: 'KFC', name: 'KFC吮指原味鸡餐', desc: '外酥里嫩，配玉米和饮料很抗饿', icon: '🍗', keyword: 'kfc fried chicken meal' },

  { type: '连锁品牌', category: '麦当劳', name: '麦辣鸡腿堡套餐', desc: '麦辣鸡腿堡 + 中薯 + 可乐，爽辣过瘾', icon: '🍔', keyword: 'mcdonald spicy chicken burger combo' },
  { type: '连锁品牌', category: '麦当劳', name: '板烧鸡腿堡组合', desc: '板烧鸡腿堡 + 麦乐鸡，酱香柔和', icon: '🍔', keyword: 'mcdonald grilled chicken burger combo' },
  { type: '连锁品牌', category: '麦当劳', name: '双层吉士汉堡套餐', desc: '双层牛肉 + 薯条 + 冰汽水，快乐翻倍', icon: '🍔', keyword: 'mcdonald cheeseburger combo' },
  { type: '连锁品牌', category: '麦当劳', name: '麦旋风甜品加餐', desc: '草莓麦旋风 + 小食拼盘，饭后小确幸', icon: '🍨', keyword: 'mcdonald mcflurry strawberry' },

  { type: '连锁品牌', category: '必胜客', name: '超级至尊披萨餐', desc: '9寸超级至尊披萨 + 烤翅，香浓拉丝满足感', icon: '🍕', keyword: 'pizza combo meal' },
  { type: '连锁品牌', category: '必胜客', name: '意式肉酱面套餐', desc: '肉酱意面 + 玉米汁，顺滑饱腹', icon: '🍝', keyword: 'bolognese pasta combo' },
  { type: '连锁品牌', category: '必胜客', name: '焗烤海鲜饭', desc: '芝士焗海鲜饭，奶香浓郁有嚼劲', icon: '🧀', keyword: 'baked seafood rice' },

  { type: '连锁品牌', category: '杨国福', name: '杨国福麻辣烫经典碗', desc: '荤素自由搭配，汤底麻辣鲜香', icon: '🍲', keyword: 'malatang bowl' },
  { type: '连锁品牌', category: '蜜雪冰城', name: '冰鲜柠檬水 + 脆筒', desc: '酸甜冰爽解腻，午后续命组合', icon: '🍋', keyword: 'lemonade ice cream cone' },
  { type: '连锁品牌', category: '瑞幸', name: '生椰拿铁 + 提拉米苏大福', desc: '椰香咖啡配甜点，治愈午后疲惫', icon: '☕', keyword: 'coconut latte dessert' },
  { type: '连锁品牌', category: '汉堡王', name: '皇堡经典套餐', desc: '火烤牛肉饼 + 薯条 + 可乐，肉感厚实', icon: '🍔', keyword: 'burger king whopper combo' },
  { type: '连锁品牌', category: '赛百味', name: '金枪鱼三明治套餐', desc: '全麦面包搭配蔬菜，轻负担有饱腹感', icon: '🥪', keyword: 'subway tuna sandwich set' },
  { type: '连锁品牌', category: '真功夫', name: '香菇鸡腿蒸饭', desc: '蒸饭控首选，鸡腿鲜嫩多汁', icon: '🍱', keyword: 'steamed chicken rice combo' },
  { type: '连锁品牌', category: '老乡鸡', name: '肥西老母鸡汤饭', desc: '汤清味鲜，暖胃又扎实', icon: '🥣', keyword: 'chicken soup rice set' },
  { type: '连锁品牌', category: '和府捞面', name: '草本汤猪软骨面', desc: '浓郁草本汤底，软骨酥烂入味', icon: '🍜', keyword: 'pork rib noodle soup' },

  { type: '轻食素食', category: '轻食', name: '鸡胸肉沙拉全麦餐', desc: '高蛋白低负担，清爽又有饱腹感', icon: '🥗', keyword: 'chicken salad whole wheat' },
  { type: '轻食素食', category: '轻食', name: '牛油果吐司 + 美式咖啡', desc: '顺滑牛油果配黑咖，清醒不油腻', icon: '🥑', keyword: 'avocado toast coffee' },
  { type: '轻食素食', category: '轻食', name: '番茄鸡蛋面（无肉）', desc: '家常清香汤底，温柔耐吃', icon: '🍅', keyword: 'tomato egg noodle' },
  { type: '轻食素食', category: '轻食', name: '藜麦能量碗', desc: '藜麦+玉米+鹰嘴豆，营养密度超高', icon: '🥗', keyword: 'quinoa bowl' },
  { type: '轻食素食', category: '轻食', name: '烤南瓜蔬菜碗', desc: '南瓜软糯香甜，搭配时蔬很清爽', icon: '🎃', keyword: 'roasted pumpkin salad bowl' },
  { type: '轻食素食', category: '轻食', name: '荞麦冷面', desc: '口感爽滑清凉，适合想吃清爽的一天', icon: '🍜', keyword: 'soba noodles' },
  { type: '轻食素食', category: '轻食', name: '豆腐菌菇盖饭', desc: '豆腐嫩滑菌香浓郁，低脂也满足', icon: '🍚', keyword: 'tofu mushroom rice bowl' },
  { type: '轻食素食', category: '轻食', name: '素食咖喱饭', desc: '椰香咖喱包裹蔬菜，香而不腻', icon: '🍛', keyword: 'vegetarian curry rice' },
  { type: '轻食素食', category: '轻食', name: '希腊酸奶水果杯', desc: '清甜低负担，午餐轻量版也很幸福', icon: '🥣', keyword: 'greek yogurt fruit bowl' },
  { type: '轻食素食', category: '轻食', name: '菠菜蘑菇全麦卷', desc: '全麦卷饼包裹蔬菜，便携又有营养', icon: '🌯', keyword: 'spinach mushroom wrap' },
  { type: '轻食素食', category: '轻食', name: '鹰嘴豆泥三明治', desc: '绵密豆泥搭配脆生蔬菜，口感层次丰富', icon: '🥪', keyword: 'hummus sandwich' },
  { type: '轻食素食', category: '轻食', name: '菌菇玉米浓汤 + 小面包', desc: '奶香浓汤暖胃，搭配小面包刚刚好', icon: '🍞', keyword: 'mushroom corn soup bread' },
]

const SPICY_KEYWORDS = ['辣', '麻', '川', '红油', '火锅', '冒菜', '酸辣', '椒', 'spicy', 'mala']
const LIGHT_MEAL_KEYWORDS = ['轻食', '沙拉', '藜麦', '酸奶', '牛油果', '全麦', '蔬菜', '冷面', '低负担']
const SNACK_KEYWORDS = ['饺', '包', '卷', '煎饼', '汤包', '糖藕', '脆筒', '甜品', '饮', '咖啡']
const FAST_FOOD_BRANDS = new Set(['KFC', '麦当劳', '汉堡王', '赛百味', '蜜雪冰城', '瑞幸'])
const FAST_FOOD_KEYWORDS = ['堡', '炸鸡', '套餐', '汉堡', '三明治', '披萨', '薯条', '卷']
const MAIN_MEAL_KEYWORDS = ['饭', '面', '粉', '锅', '鱼', '排骨', '牛肉', '鸡', '盖浇', '炖']

const hashText = (text: string): number => {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

const inferSpicyLevel = (seed: FoodSeed): FoodSpicyLevel => {
  const text = `${seed.name}${seed.desc}${seed.keyword}`.toLowerCase()
  const isSpicy = SPICY_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()))
  return isSpicy ? '辣' : '不辣'
}

const inferMealCategory = (seed: FoodSeed): FoodMealCategory => {
  const text = `${seed.name}${seed.desc}`

  if (seed.type === '轻食素食' || LIGHT_MEAL_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return '轻食'
  }

  if (FAST_FOOD_BRANDS.has(seed.category) || FAST_FOOD_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return '快餐'
  }

  if (SNACK_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return '小吃'
  }

  if (MAIN_MEAL_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return '正餐'
  }

  return '正餐'
}

const buildEstimatedPrice = (seed: FoodSeed, mealCategory: FoodMealCategory): number => {
  const baseByCategory: Record<FoodMealCategory, number> = {
    快餐: 28,
    正餐: 38,
    小吃: 18,
    轻食: 32,
  }

  const delta = hashText(`${seed.name}-${seed.category}`) % 11
  const spicyBonus = inferSpicyLevel(seed) === '辣' ? 2 : 0
  return baseByCategory[mealCategory] + delta + spicyBonus
}

export const FOOD_LIST: FoodItem[] = FOOD_SEEDS.map((item, index) => {
  const mealCategory = inferMealCategory(item)
  return {
    ...item,
    id: `food-${index + 1}`,
    img: buildFoodImage(item.keyword),
    spicyLevel: inferSpicyLevel(item),
    mealCategory,
    price: buildEstimatedPrice(item, mealCategory),
  }
})

export const FOOD_TYPE_OPTIONS: Array<{ key: 'all' | FoodType; label: string }> = [
  { key: 'all', label: '全都想吃' },
  { key: '地域美食', label: '地域美食' },
  { key: '荤素套餐', label: '荤素套餐' },
  { key: '连锁品牌', label: '连锁品牌' },
  { key: '轻食素食', label: '轻食素食' },
]

export const FOOD_SPICY_OPTIONS: Array<{ key: 'all' | FoodSpicyLevel; label: string }> = [
  { key: 'all', label: '辣度不限' },
  { key: '辣', label: '辣味上头' },
  { key: '不辣', label: '清爽不辣' },
]

export const FOOD_MEAL_CATEGORY_OPTIONS: Array<{ key: 'all' | FoodMealCategory; label: string }> = [
  { key: 'all', label: '餐型不限' },
  { key: '快餐', label: '快餐' },
  { key: '正餐', label: '正餐' },
  { key: '小吃', label: '小吃' },
  { key: '轻食', label: '轻食' },
]

export const FOOD_PRICE_RANGE_OPTIONS: Array<{ key: FoodPriceRangeKey; label: string }> = [
  { key: 'all', label: '价格不限' },
  { key: '0-25', label: '25元以内' },
  { key: '25-45', label: '25-45元' },
  { key: '45+', label: '45元以上' },
]
