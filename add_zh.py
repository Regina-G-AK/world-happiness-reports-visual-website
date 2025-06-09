import pandas as pd
import os

# 国家名称中英文对照字典
# 数据来源：ISO 3166-1国家代码标准及常用中文译名
COUNTRY_TRANSLATIONS = {
    "Afghanistan": "阿富汗",
    "Albania": "阿尔巴尼亚",
    "Algeria": "阿尔及利亚",
    "Argentina": "阿根廷",
    "Armenia": "亚美尼亚",
    "Australia": "澳大利亚",
    "Austria": "奥地利",
    "Azerbaijan": "阿塞拜疆",
    "Bahrain": "巴林",
    "Bangladesh": "孟加拉国",
    "Belarus": "白俄罗斯",
    "Belgium": "比利时",
    "Benin": "贝宁",
    "Bolivia": "玻利维亚",
    "Bosnia and Herzegovina": "波斯尼亚和黑塞哥维那",
    "Botswana": "博茨瓦纳",
    "Brazil": "巴西",
    "Bulgaria": "保加利亚",
    "Burkina Faso": "布基纳法索",
    "Burundi": "布隆迪",
    "Cambodia": "柬埔寨",
    "Cameroon": "喀麦隆",
    "Canada": "加拿大",
    "Chad": "乍得",
    "Chile": "智利",
    "China": "中国",
    "Colombia": "哥伦比亚",
    "Comoros": "科摩罗",
    "Congo (Brazzaville)": "刚果(布)",
    "Congo (Kinshasa)": "刚果(金)",
    "Costa Rica": "哥斯达黎加",
    "Croatia": "克罗地亚",
    "Cyprus": "塞浦路斯",
    "Czech Republic": "捷克",
    "Denmark": "丹麦",
    "Djibouti": "吉布提",
    "Dominican Republic": "多米尼加",
    "Ecuador": "厄瓜多尔",
    "Egypt": "埃及",
    "El Salvador": "萨尔瓦多",
    "Estonia": "爱沙尼亚",
    "Ethiopia": "埃塞俄比亚",
    "Finland": "芬兰",
    "France": "法国",
    "Gabon": "加蓬",
    "Gambia": "冈比亚",
    "Georgia": "格鲁吉亚",
    "Germany": "德国",
    "Ghana": "加纳",
    "Greece": "希腊",
    "Guatemala": "危地马拉",
    "Guinea": "几内亚",
    "Haiti": "海地",
    "Honduras": "洪都拉斯",
    "Hong Kong": "中国香港",
    "Hong Kong China": "中国香港",
    "Hungary": "匈牙利",
    "Iceland": "冰岛",
    "India": "印度",
    "Indonesia": "印度尼西亚",
    "Iran": "伊朗",
    "Iraq": "伊拉克",
    "Ireland": "爱尔兰",
    "Israel": "以色列",
    "Italy": "意大利",
    "Ivory Coast": "科特迪瓦",
    "Jamaica": "牙买加",
    "Japan": "日本",
    "Jordan": "约旦",
    "Kazakhstan": "哈萨克斯坦",
    "Kenya": "肯尼亚",
    "Kosovo": "科索沃",
    "Kuwait": "科威特",
    "Kyrgyzstan": "吉尔吉斯斯坦",
    "Laos": "老挝",
    "Latvia": "拉脱维亚",
    "Lebanon": "黎巴嫩",
    "Lesotho": "莱索托",
    "Liberia": "利比里亚",
    "Libya": "利比亚",
    "Lithuania": "立陶宛",
    "Luxembourg": "卢森堡",
    "Macedonia": "北马其顿",
    "Madagascar": "马达加斯加",
    "Malawi": "马拉维",
    "Malaysia": "马来西亚",
    "Maldives": "马尔代夫",
    "Mali": "马里",
    "Malta": "马耳他",
    "Mauritania": "毛里塔尼亚",
    "Mauritius": "毛里求斯",
    "Mexico": "墨西哥",
    "Moldova": "摩尔多瓦",
    "Mongolia": "蒙古",
    "Montenegro": "黑山",
    "Morocco": "摩洛哥",
    "Mozambique": "莫桑比克",
    "Myanmar": "缅甸",
    "Namibia": "纳米比亚",
    "Nepal": "尼泊尔",
    "Netherlands": "荷兰",
    "New Zealand": "新西兰",
    "Nicaragua": "尼加拉瓜",
    "Niger": "尼日尔",
    "Nigeria": "尼日利亚",
    "North Cyprus": "北塞浦路斯",
    "Norway": "挪威",
    "Oman": "阿曼",
    "Pakistan": "巴基斯坦",
    "Palestinian Territories": "巴勒斯坦",
    "Panama": "巴拿马",
    "Paraguay": "巴拉圭",
    "Peru": "秘鲁",
    "Philippines": "菲律宾",
    "Poland": "波兰",
    "Portugal": "葡萄牙",
    "Qatar": "卡塔尔",
    "Romania": "罗马尼亚",
    "Russia": "俄罗斯",
    "Rwanda": "卢旺达",
    "Saudi Arabia": "沙特阿拉伯",
    "Senegal": "塞内加尔",
    "Serbia": "塞尔维亚",
    "Sierra Leone": "塞拉利昂",
    "Singapore": "新加坡",
    "Slovakia": "斯洛伐克",
    "Slovenia": "斯洛文尼亚",
    "Somaliland region": "索马里兰地区",
    "South Africa": "南非",
    "South Korea": "韩国",
    "Spain": "西班牙",
    "Sri Lanka": "斯里兰卡",
    "Sudan": "苏丹",
    "Suriname": "苏里南",
    "Swaziland": "斯威士兰",
    "Sweden": "瑞典",
    "Switzerland": "瑞士",
    "Syria": "叙利亚",
    "Taiwan": "中国台湾",
    "Taiwan China": "中国台湾",
    "Tajikistan": "塔吉克斯坦",
    "Tanzania": "坦桑尼亚",
    "Thailand": "泰国",
    "Togo": "多哥",
    "Trinidad and Tobago": "特立尼达和多巴哥",
    "Tunisia": "突尼斯",
    "Turkey": "土耳其",
    "Turkmenistan": "土库曼斯坦",
    "Uganda": "乌干达",
    "Ukraine": "乌克兰",
    "United Arab Emirates": "阿拉伯联合酋长国",
    "United Kingdom": "英国",
    "United States": "美国",
    "Uruguay": "乌拉圭",
    "Uzbekistan": "乌兹别克斯坦",
    "Venezuela": "委内瑞拉",
    "Vietnam": "越南",
    "Yemen": "也门",
    "Zambia": "赞比亚",
    "Zimbabwe": "津巴布韦",
    "Congo": "刚果(布)",
    "Bhutan": "不丹",
    "Angola": "安哥拉",
    "Central African Republic": "中非共和国",
    "South Sudan": "南苏丹",
    "Puerto Rico": "波多黎各",
    "Belize": "伯利兹",
    "Somalia": "索马里",
    "Somaliland Region": "索马里兰地区",
    "Trinidad & Tobago": "特立尼达和多巴哥",
    "Northern Cyprus": "北塞浦路斯",
    "North Macedonia": "北马其顿",
    "Eswatini": "斯威士兰",
    "State of Palestine": "巴勒斯坦",
    "Turkiye": "土耳其",
    "Czechia": "捷克"
}

def add_chinese_translations(input_file, output_file=None):
    """
    为幸福报告CSV文件添加中文国家名称
    
    参数:
    input_file (str): 输入CSV文件路径
    output_file (str): 输出CSV文件路径（可选）
    """
    # 读取CSV文件
    df = pd.read_csv(input_file)
    
    # 检测国家名称列
    country_col = None
    for col in ['Country', 'Country name', 'Country name']:
        if col in df.columns:
            country_col = col
            break
    
    if not country_col:
        raise ValueError("未找到国家名称列")
    
    # 添加中文名称列
    df['Country_Chinese'] = df[country_col].map(COUNTRY_TRANSLATIONS)
    
    # 处理未匹配的国家
    missing_countries = df[df['Country_Chinese'].isnull()][country_col].unique()
    if len(missing_countries) > 0:
        print(f"警告: 以下国家未找到中文翻译: {', '.join(missing_countries)}")
        print("请在翻译字典中添加这些国家的翻译")
    
    # 设置输出文件名
    if output_file is None:
        base, ext = os.path.splitext(input_file)
        output_file = f"{base}_with_chinese{ext}"
    
    # 保存结果
    df.to_csv(output_file, index=False)
    print(f"处理完成! 结果已保存至: {output_file}")
    print(f"添加了 {df['Country_Chinese'].count()} 个国家的中文名称")
    
    return output_file

def process_directory(directory, output_suffix="_with_chinese"):
    """
    处理目录中的所有CSV文件
    
    参数:
    directory (str): 包含CSV文件的目录
    output_suffix (str): 输出文件后缀
    """
    for filename in os.listdir(directory):
        if filename.endswith(".csv"):
            input_path = os.path.join(directory, filename)
            base, ext = os.path.splitext(filename)
            output_path = os.path.join(directory, f"{base}{output_suffix}{ext}")
            
            print(f"\n处理文件: {filename}")
            add_chinese_translations(input_path, output_path)

if __name__ == "__main__":
    # 使用示例
    
    # 处理单个文件
    # add_chinese_translations("2021.csv")
    
    # 处理整个目录
    process_directory("world happiness reports 2015-2024")
    
    # 显示翻译字典中的国家数量
    print(f"\n翻译字典包含 {len(COUNTRY_TRANSLATIONS)} 个国家/地区的中文名称")