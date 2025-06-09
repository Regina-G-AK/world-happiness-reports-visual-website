import csv
import pycountry
from pycountry_convert import country_alpha2_to_continent_code, country_name_to_country_alpha2

continent_mapping = {
            'AF': 'Africa',
            'AS': 'Asia',
            'EU': 'Europe',
            'NA': 'North America',
            'SA': 'South America',
            'OC': 'Oceania',
            'AN': 'Antarctica'
        }

def get_continent(country_name):
    """
    根据国家名称获取大洲信息
    
    参数:
        country_name (str): 国家名称
        
    返回:
        str: 大洲名称或 "Unknown"
    """
    try:
        # 尝试将国家名称转换为 ISO 3166-1 alpha-2 代码
        country_alpha2 = country_name_to_country_alpha2(country_name)
        
        # 将国家代码转换为大洲代码
        continent_code = country_alpha2_to_continent_code(country_alpha2)
        
        # 将大洲代码转换为完整的大洲名称
        
        return continent_mapping.get(continent_code, "Unknown")
    
    except KeyError:
        # 如果找不到国家名称，尝试使用 pycountry 进行模糊匹配
        try:
            country = pycountry.countries.search_fuzzy(country_name)
            if country:
                # 使用第一个匹配结果
                country_alpha2 = country[0].alpha_2
                continent_code = country_alpha2_to_continent_code(country_alpha2)
                return continent_mapping.get(continent_code, "Unknown")
        except LookupError:
            pass
    
    return "Unknown"

def add_continent_to_csv(input_file, output_file, country_column="Country"):
    """
    为CSV文件中的每一行添加大洲信息
    
    参数:
        input_file (str): 输入CSV文件路径
        output_file (str): 输出CSV文件路径
        country_column (str): 包含国家名的列名，默认为"国家名"
    """
    # 读取输入文件并添加大洲列
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames + ['continent']  # 添加新列
        
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        
        processed_count = 0
        unknown_count = 0
        
        for row in reader:
            country = row[country_column].strip()
            if not country:  # 跳过空值
                continent = "Unknown"
                unknown_count += 1
            else:
                continent = get_continent(country)
                if continent == "Unknown":
                    unknown_count += 1
            
            # 添加大洲信息到当前行
            row['continent'] = continent
            writer.writerow(row)
            
            processed_count += 1
    
    print(f"处理完成！结果已保存到: {output_file}")
    print(f"总处理行数: {processed_count}")
    print(f"未能识别的大洲数量: {unknown_count}")
    if unknown_count > 0:
        print("提示: 检查国家名称是否正确拼写，或考虑添加自定义映射")

# 使用示例
if __name__ == "__main__":
    input_dir = "world happiness reports 2015-2024"
    for i in range(2015, 2025):
        input_csv = f"{input_dir}/{i}_with_chinese.csv"
        output_csv = f"{input_dir}/{i}.csv"
        add_continent_to_csv(input_csv, output_csv)