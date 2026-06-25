#!/usr/bin/env python3
"""
将图标着色为主题绿色（选中状态）
"""
from PIL import Image
import sys
import os

def tint_image(input_path, output_path, tint_color):
    """
    将图片着色为指定颜色
    tint_color: (R, G, B) 元组，例如 (60, 197, 31) 对应 #3cc51f
    """
    # 打开图片
    img = Image.open(input_path).convert("RGBA")
    
    # 将颜色转换为 RGB 元组
    if isinstance(tint_color, str):
        # 如果是十六进制字符串，转换为 RGB
        tint_color = tint_color.lstrip('#')
        r = int(tint_color[0:2], 16)
        g = int(tint_color[2:4], 16)
        b = int(tint_color[4:6], 16)
        tint_color = (r, g, b)
    
    # 分离 alpha 通道
    data = img.getdata()
    new_data = []
    
    for item in data:
        # 如果像素是透明的，保持透明
        if item[3] == 0:
            new_data.append((0, 0, 0, 0))
        else:
            # 计算灰度值作为不透明度
            gray = int(0.299 * item[0] + 0.587 * item[1] + 0.114 * item[2])
            # 使用灰度值混合原色和着色
            alpha = item[3] / 255.0
            r = int(tint_color[0] * alpha + (1 - alpha) * item[0])
            g = int(tint_color[1] * alpha + (1 - alpha) * item[1])
            b = int(tint_color[2] * alpha + (1 - alpha) * item[2])
            new_data.append((r, g, b, item[3]))
    
    # 创建新图片
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"✅ 已生成着色图标: {output_path}")

if __name__ == "__main__":
    input_file = "practice.png"
    output_file = "practice-active.png"
    tint_color = "#3cc51f"  # TabBar 选中颜色
    
    if os.path.exists(input_file):
        tint_image(input_file, output_file, tint_color)
    else:
        print(f"❌ 文件不存在: {input_file}")
