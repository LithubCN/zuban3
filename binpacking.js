class Rectangle {
    constructor(width, height, id) {
        this.width = width;
        this.height = height;
        this.id = id;
        this.x = 0;
        this.y = 0;
    }
}

// 添加全局颜色映射
const sizeColorMap = new Map();
let colorIndex = 0;
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
    '#F1C40F', '#E74C3C', '#1ABC9C', '#34495E', '#95A5A6'
];

function getColorForSize(size) {
    if (!sizeColorMap.has(size)) {
        sizeColorMap.set(size, colors[colorIndex % colors.length]);
        colorIndex++;
    }
    return sizeColorMap.get(size);
}

class BinPacking2D {
    constructor(bin_width, bin_height, min_width, min_height) {
        this.bin_width = bin_width;
        this.bin_height = bin_height;
        this.min_width = min_width;
        this.min_height = min_height;
        this.containers = [];
        this.current_container = [];
    }

    canPlace(rect, x, y) {
        // 检查是否超出容器边界
        if (x + rect.width > this.bin_width || y + rect.height > this.bin_height) {
            return false;
        }
        
        // 检查是否与已放置的矩形重叠
        for (const placed_rect of this.current_container) {
            if (x < placed_rect.x + placed_rect.width &&
                x + rect.width > placed_rect.x &&
                y < placed_rect.y + placed_rect.height &&
                y + rect.height > placed_rect.y) {
                return false;
            }
        }
        return true;
    }

    getPlacementPoints() {
        const points = [[0, 0]];  // 起始点
        
        for (const rect of this.current_container) {
            points.push([rect.x + rect.width, rect.y]);  // 右上角
            points.push([rect.x, rect.y + rect.height]); // 左上角
        }
        
        // 去除重复点和超出边界的点
        const validPoints = points.filter(([x, y]) => 
            x < this.bin_width && y < this.bin_height
        ).filter((point, index, self) =>
            index === self.findIndex(p => p[0] === point[0] && p[1] === point[1])
        );
        
        // 按照从下到上，从左到右排序
        return validPoints.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    }

    calculateWaste(rect, x, y) {
        let waste = 0;
        
        // 计算与其他矩形之间的空隙
        for (const placed_rect of this.current_container) {
            if (y < placed_rect.y + placed_rect.height &&
                y + rect.height > placed_rect.y) {
                if (x > placed_rect.x + placed_rect.width) {
                    waste += (x - (placed_rect.x + placed_rect.width)) * 
                            Math.min(rect.height, placed_rect.height);
                } else if (placed_rect.x > x + rect.width) {
                    waste += (placed_rect.x - (x + rect.width)) * 
                            Math.min(rect.height, placed_rect.height);
                }
            }
        }
        
        // 考虑边界距离
        waste += x * rect.height;  // 左边界空隙
        waste += y * rect.width;   // 底边界空隙
        
        return waste;
    }

    findBestPosition(rect) {
        let best_x = null;
        let best_y = null;
        let min_waste = Infinity;
        
        const placement_points = this.getPlacementPoints();
        
        for (const [x, y] of placement_points) {
            if (this.canPlace(rect, x, y)) {
                const waste = this.calculateWaste(rect, x, y);
                if (waste < min_waste) {
                    min_waste = waste;
                    best_x = x;
                    best_y = y;
                }
            }
        }
        
        return [best_x, best_y];
    }

    pack(rectangles) {
        // 按面积和最小边长排序
        const sorted_rectangles = [...rectangles].sort((a, b) => {
            const area_diff = (b.width * b.height) - (a.width * a.height);
            if (area_diff !== 0) return area_diff;
            return Math.min(b.width, b.height) - Math.min(a.width, a.height);
        });
        
        let remaining_rectangles = [...sorted_rectangles];
        this.containers = [];
        
        while (remaining_rectangles.length > 0) {
            this.current_container = [];
            const unplaced = [];
            
            for (const rect of remaining_rectangles) {
                // 尝试两种方向
                const original_width = rect.width;
                const original_height = rect.height;
                let best_x = null;
                let best_y = null;
                let best_rotation = false;
                let min_waste = Infinity;
                
                // 不旋转的情况
                let [x, y] = this.findBestPosition(rect);
                if (x !== null) {
                    const waste = this.calculateWaste(rect, x, y);
                    if (waste < min_waste) {
                        min_waste = waste;
                        [best_x, best_y] = [x, y];
                        best_rotation = false;
                    }
                }
                
                // 旋转90度的情况
                [rect.width, rect.height] = [rect.height, rect.width];
                [x, y] = this.findBestPosition(rect);
                if (x !== null) {
                    const waste = this.calculateWaste(rect, x, y);
                    if (waste < min_waste) {
                        min_waste = waste;
                        [best_x, best_y] = [x, y];
                        best_rotation = true;
                    }
                }
                
                // 恢复原始尺寸
                [rect.width, rect.height] = [original_width, original_height];
                
                if (best_x !== null) {
                    if (best_rotation) {
                        [rect.width, rect.height] = [rect.height, rect.width];
                    }
                    rect.x = best_x;
                    rect.y = best_y;
                    this.current_container.push(rect);
                } else {
                    unplaced.push(rect);
                }
            }
            
            if (this.current_container.length > 0) {
                // 计算实际使用的最大长度和宽度
                const max_x = Math.max(...this.current_container.map(r => r.x + r.width));
                const max_y = Math.max(...this.current_container.map(r => r.y + r.height));
                
                // 确保尺寸不小于最小值
                const actual_width = Math.max(max_x, this.min_width);
                const actual_height = Math.max(max_y, this.min_height);
                
                this.containers.push({
                    rectangles: this.current_container,
                    width: actual_width,
                    height: actual_height
                });
            }
            
            remaining_rectangles = unplaced;
        }
        
        return this.containers;
    }
}

// 全局变量
let rectangleList = [];
let currentContainers = [];
let activeTabIndex = 0;

// UI处理函数
function addRectangle() {
    const length = parseInt(document.getElementById('rectLength').value);
    const width = parseInt(document.getElementById('rectWidth').value);
    const count = parseInt(document.getElementById('rectCount').value);
    
    if (!length || !width || !count || length <= 0 || width <= 0 || count <= 0) {
        alert('请输入有效的正整数！');
        return;
    }
    
    const tbody = document.querySelector('#rectTable tbody');
    const size = `${length}×${width}`;
    
    // 检查是否已存在相同尺寸
    let existingRow = Array.from(tbody.rows).find(row => 
        row.cells[0].textContent === size
    );
    
    if (existingRow) {
        const currentCount = parseInt(existingRow.cells[1].textContent);
        existingRow.cells[1].textContent = currentCount + count;
    } else {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = size;
        row.insertCell(1).textContent = count;
        const actionCell = row.insertCell(2);
        actionCell.innerHTML = '<button onclick="editRectangle(this)">编辑</button>';
    }
    
    // 清空输入
    document.getElementById('rectLength').value = '';
    document.getElementById('rectWidth').value = '';
    document.getElementById('rectCount').value = '1';
}

function clearRectangles() {
    document.querySelector('#rectTable tbody').innerHTML = '';
}

function runPacking() {
    // 重置颜色映射
    sizeColorMap.clear();
    colorIndex = 0;
    // 收集矩形数据
    const rectangles = [];
    let rectId = 1;
    
    document.querySelector('#rectTable tbody').querySelectorAll('tr').forEach(row => {
        const [length, width] = row.cells[0].textContent.split('×').map(Number);
        const count = parseInt(row.cells[1].textContent);
        
        for (let i = 0; i < count; i++) {
            rectangles.push(new Rectangle(length, width, `R${rectId++}`));
        }
    });
    
    if (rectangles.length === 0) {
        alert('请先添加矩形！');
        return;
    }
    
    // 获取容器尺寸范围
    const minLength = parseInt(document.getElementById('minLength').value);
    const maxLength = parseInt(document.getElementById('maxLength').value);
    const minWidth = parseInt(document.getElementById('minWidth').value);
    const maxWidth = parseInt(document.getElementById('maxWidth').value);
    
    let bestSolution = null;
    let bestAvgUtilization = 0;
    
    // 尝试不同的容器尺寸
    for (let length = minLength; length <= maxLength; length += 1000) {
        for (let width = minWidth; width <= maxWidth; width += 100) {
            const packer = new BinPacking2D(length, width, minLength, minWidth);
            const containers = packer.pack([...rectangles]);
            
            // 计算平均利用率
            const utilizations = containers.map(container => {
                const totalArea = container.width * container.height;
                const usedArea = container.rectangles.reduce((sum, rect) => 
                    sum + rect.width * rect.height, 0
                );
                return (usedArea / totalArea) * 100;
            });
            
            const avgUtilization = utilizations.reduce((a, b) => a + b, 0) / utilizations.length;
            
            // 检查是否所有容器的利用率都超过50%
            if (utilizations.every(u => u >= 50) && avgUtilization > bestAvgUtilization) {
                bestAvgUtilization = avgUtilization;
                bestSolution = {
                    containers: containers,
                    utilizations: utilizations
                };
            }
        }
    }
    
    if (bestSolution) {
        currentContainers = bestSolution.containers;
        displayResults();
        
        // 显示详细信息
        const details = `平均利用率: ${bestAvgUtilization.toFixed(1)}%\n` +
            bestSolution.utilizations.map((u, i) => 
                `容器 ${i + 1}: 利用率 ${u.toFixed(1)}%`
            ).join('\n');
        alert(details);
    } else {
        alert('未找到满足条件的解决方案');
    }
}

function displayResults() {
    // 创建标签页
    const tabButtons = document.getElementById('tabButtons');
    tabButtons.innerHTML = '';
    
    currentContainers.forEach((container, index) => {
        const button = document.createElement('button');
        button.className = 'tab-button' + (index === 0 ? ' active' : '');
        button.textContent = `大板 ${index + 1}`;
        button.onclick = () => switchTab(index);
        tabButtons.appendChild(button);
    });
    
    // 显示第一个容器
    activeTabIndex = 0;
    drawContainer(currentContainers[0]);
}

function switchTab(index) {
    document.querySelectorAll('.tab-button').forEach((btn, i) => {
        btn.className = 'tab-button' + (i === index ? ' active' : '');
    });
    activeTabIndex = index;
    drawContainer(currentContainers[index]);
}

function drawContainer(container) {
    const canvas = document.getElementById('displayCanvas');
    const ctx = canvas.getContext('2d');
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 获取容器尺寸
    const containerWidth = container.width;
    const containerHeight = container.height;
    
    // 计算缩放比例
    const canvasWidth = 800;
    const canvasHeight = 600;
    const margin = 50;
    
    const scaleX = (canvasWidth - 2 * margin - 150) / containerWidth; // 为图例留出空间
    const scaleY = (canvasHeight - 2 * margin) / containerHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // 设置画布尺寸
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // 计算偏移量以居中显示
    const offsetX = margin + (canvasWidth - 2 * margin - 150 - containerWidth * scale) / 2;
    const offsetY = margin + (canvasHeight - 2 * margin - containerHeight * scale) / 2;
    
    // 绘制容器边框
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, containerWidth * scale, containerHeight * scale);
    
    // 绘制网格
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    const gridSize = 1000;
    for (let x = 0; x <= containerWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * scale, offsetY);
        ctx.lineTo(offsetX + x * scale, offsetY + containerHeight * scale);
        ctx.stroke();
    }
    for (let y = 0; y <= containerHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * scale);
        ctx.lineTo(offsetX + containerWidth * scale, offsetY + y * scale);
        ctx.stroke();
    }
    
    // 收集不同尺寸的矩形并分配颜色
    const rectTypes = new Map();
    for (const rect of container.rectangles) {
        const key = `${rect.width}×${rect.height}`;
        if (!rectTypes.has(key)) {
            rectTypes.set(key, {
                color: getColorForSize(key),
                count: 1
            });
        } else {
            rectTypes.get(key).count++;
        }
    }
    
    // 修改坐标系统，使Y轴从下往上
    const transformY = (y) => containerHeight - y;  // 添加这个转换函数
    
    // 绘制矩形
    for (const rect of container.rectangles) {
        const key = `${rect.width}×${rect.height}`;
        const color = rectTypes.get(key).color;
        
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(
            offsetX + rect.x * scale,
            offsetY + transformY(rect.y + rect.height) * scale,  // 修改这里
            rect.width * scale,
            rect.height * scale
        );
        
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            offsetX + rect.x * scale,
            offsetY + transformY(rect.y + rect.height) * scale,  // 修改这里
            rect.width * scale,
            rect.height * scale
        );
        
        // 绘制ID标签
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            rect.id,
            offsetX + (rect.x + rect.width/2) * scale,
            offsetY + transformY(rect.y + rect.height/2) * scale  // 修改这里
        );
    }
    
    // 绘制图例
    const legendX = canvasWidth - 140;
    const legendY = margin;
    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('图例:', legendX, legendY);
    
    let y = legendY + 30;
    for (const [size, info] of rectTypes) {
        // 绘制颜色块
        ctx.fillStyle = info.color;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(legendX, y, 20, 20);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'black';
        ctx.strokeRect(legendX, y, 20, 20);
        
        // 绘制文字
        ctx.fillStyle = 'black';
        ctx.fillText(`${size} (${info.count}个)`, legendX + 30, y + 10);
        y += 30;
    }
    
    // 更新状态栏
    const utilization = calculateUtilization(container);
    document.getElementById('statusBar').textContent = 
        `大板 ${activeTabIndex + 1}: ${containerWidth}×${containerHeight}, 利用率: ${utilization.toFixed(1)}%`;
}

function calculateUtilization(container) {
    const totalArea = container.width * container.height;
    const usedArea = container.rectangles.reduce((sum, rect) => 
        sum + rect.width * rect.height, 0
    );
    return (usedArea / totalArea) * 100;
}

function editRectangle(button) {
    const row = button.parentNode.parentNode;
    const [length, width] = row.cells[0].textContent.split('×').map(Number);
    const count = parseInt(row.cells[1].textContent);
    
    // 创建模态对话框
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border: 1px solid #ccc;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
    `;
    
    dialog.innerHTML = `
        <h3>编辑子板</h3>
        <div>
            <label>长度: <input type="number" id="editLength" value="${length}"></label>
        </div>
        <div>
            <label>宽度: <input type="number" id="editWidth" value="${width}"></label>
        </div>
        <div>
            <label>数量: <input type="number" id="editCount" value="${count}"></label>
        </div>
        <div style="margin-top: 10px;">
            <button onclick="updateRectangle(this)">确定</button>
            <button onclick="this.parentNode.parentNode.remove()">取消</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
}

function updateRectangle(button) {
    const dialog = button.parentNode.parentNode;
    const length = parseInt(dialog.querySelector('#editLength').value);
    const width = parseInt(dialog.querySelector('#editWidth').value);
    const count = parseInt(dialog.querySelector('#editCount').value);
    
    if (!length || !width || !count || length <= 0 || width <= 0 || count <= 0) {
        alert('请输入有效的正整数！');
        return;
    }
    
    // 更新表格中的数据
    const rows = document.querySelector('#rectTable tbody').rows;
    for (const row of rows) {
        const [oldLength, oldWidth] = row.cells[0].textContent.split('×').map(Number);
        if (oldLength === length && oldWidth === width) {
            row.cells[1].textContent = count;
            dialog.remove();
            return;
        }
    }
} 
