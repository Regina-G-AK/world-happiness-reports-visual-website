import csv
import os

def check_duplicates(csv_file, column_name):
    """
    检查CSV文件中指定列是否有重复值
    
    参数:
        csv_file (str): CSV文件路径
        column_name (str): 要检查的列名
    
    返回:
        tuple: (是否有重复, 重复值集合, 重复值计数)
    """
    values = []  # 存储列值
    duplicates = set()  # 存储重复值
    seen = set()  # 临时存储已出现的值
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        # 检查列名是否存在
        if column_name not in reader.fieldnames:
            raise ValueError(f"列名 '{column_name}' 不存在于CSV文件中")
        
        # 读取所有行的指定列值
        for row in reader:
            value = row[column_name]
            values.append(value)
            
            # 实时检查重复
            if value in seen:
                duplicates.add(value)
            else:
                seen.add(value)
    
    # 统计重复次数
    from collections import Counter
    counter = Counter(values)
    duplicate_counts = {val: count for val, count in counter.items() if count > 1}
    
    has_duplicates = len(duplicates) > 0
    return has_duplicates, duplicates, duplicate_counts

# 使用示例
if __name__ == "__main__":
    input_dir="world happiness reports 2015-2024"
    column = "Country_Chinese" 

    for i in range(2015, 2025):
        input_path=os.path.join(input_dir, f"{i}_with_chinese.csv")
        if not os.path.exists(input_path):
            print(f"文件 {input_path} 不存在，跳过检查。")
            continue    
        try:
            has_dup, dup_values, dup_counts = check_duplicates(input_path, column)
            
            if has_dup:
                print(f"发现重复值! 共 {len(dup_values)} 个唯一重复值")
                print("重复值及出现次数:")
                for value, count in dup_counts.items():
                    print(f"  {value}: {count}次")
            else:
                print("未发现重复值")
        except Exception as e:
            print(f"发生错误: {str(e)}")