export const RANDOM_IMAGE_API_URL = 'https://uapis.cn/api/v1/random/image'

export const randomImageCategories = [
  'acg',
  'landscape',
  'anime',
  'pc_wallpaper',
  'mobile_wallpaper',
  'general_anime',
  'ai_drawing',
  'bq',
  'furry',
] as const
export type RandomImageCategory = (typeof randomImageCategories)[number]

const subcategories = {
  acg: ['pc', 'mb'],
  bq: ['eciyuan', 'ikun', 'xiongmao', 'waiguoren', 'maomao'],
  furry: ['z4k', 'szs8k', 's4k', '4k'],
} as const

export interface RandomImageQuery {
  category?: RandomImageCategory
  type?: (typeof subcategories)[keyof typeof subcategories][number]
}

export function createRandomImageUrl(query: RandomImageQuery = {}): URL {
  const { category, type } = query
  if (category !== undefined && !randomImageCategories.includes(category)) {
    throw new RangeError('不支持的随机图片分类。')
  }
  if (type !== undefined) {
    const allowed: readonly string[] =
      category && Object.hasOwn(subcategories, category)
        ? subcategories[category as keyof typeof subcategories]
        : []
    if (!allowed.includes(type)) throw new RangeError('图片子分类与主分类不匹配。')
  }
  const url = new URL(RANDOM_IMAGE_API_URL)
  if (category !== undefined) url.searchParams.set('category', category)
  if (type !== undefined) url.searchParams.set('type', type)
  return url
}
