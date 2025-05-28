/**
 * 嘉航作息表 - 主要功能脚本
 * 2岁儿童作息记录系统
 */

// 2岁儿童标准作息时间表（基于美国睡眠医学会建议）
const standardSchedule = {
    '06:00': '起床',
    '06:30': '晨间护理',
    '07:00': '早餐',
    '08:00': '自由活动',
    '09:30': '户外活动',
    '10:30': '小食时间',
    '11:00': '学习游戏',
    '12:00': '午餐',
    '13:00': '午睡开始',
    '15:00': '午睡结束',
    '15:30': '下午小食',
    '16:00': '室内活动',
    '17:00': '户外游戏',
    '18:00': '晚餐',
    '19:00': '洗澡时间',
    '19:30': '安静活动',
    '20:00': '睡前故事',
    '20:30': '晚安睡觉'
};

// 全局变量
let isPreviewMode = false;
let scheduleData = {};
let modalEventsInitialized = false; // 防止重复绑定事件的标志

// 新增功能的全局变量
let selectedCells = [];
let isSelecting = false;
let mergedCells = new Map(); // 存储合并单元格信息
let currentUserId = 'default'; // 可以根据实际需求修改用户识别逻辑

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 嘉航作息表初始化中...');
    
    // 绑定原有事件
    document.getElementById('generateBtn').addEventListener('click', generateScheduleTable);
    document.getElementById('previewBtn').addEventListener('click', togglePreviewMode);
    document.getElementById('exportBtn').addEventListener('click', exportToPDF);
    
    // 绑定新功能事件
    document.getElementById('saveTableBtn').addEventListener('click', saveCurrentTable);
    document.getElementById('mergeCellsBtn').addEventListener('click', mergeCells);
    document.getElementById('unmergeCellsBtn').addEventListener('click', unmergeCells);
    document.getElementById('clearSelectionBtn').addEventListener('click', clearSelection);
    
    // 绑定标题编辑事件
    const titleInput = document.getElementById('titleInput');
    titleInput.addEventListener('input', function() {
        saveTitleData(this.value);
    });
    
    // 绑定标准作息来源编辑事件
    const scheduleSource = document.getElementById('scheduleSource');
    scheduleSource.addEventListener('blur', function() {
        saveScheduleSource(this.textContent.trim());
    });
    
    // 初始化欢迎弹窗事件绑定
    initWelcomeModal();
    
    // 自动生成表格
    generateScheduleTable();
    
    // 加载保存的数据
    loadSavedData();
    
    // 加载保存的表格列表
    loadSavedTables();
    
    // 显示欢迎弹窗
    showWelcomeModal();
    
    console.log('✅ 初始化完成');
});

// 生成作息表格
function generateScheduleTable() {
    // 显示加载状态
    const tableContainer = document.getElementById('tableContainer');
    tableContainer.innerHTML = '<div class="loading">正在生成表格...</div>';
    
    // 模拟加载延迟
    setTimeout(() => {
        // 固定显示31天
        const daysInMonth = 31;
        
        // 生成表格
        const table = createScheduleTable(daysInMonth);
        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);
        
        // 添加育儿建议到表格下方
        const parentingTips = createParentingTips();
        tableContainer.appendChild(parentingTips);
        
        // 恢复保存的数据
        restoreTableData();
        
        // 显示表格工具栏
        document.getElementById('tableTools').style.display = 'block';
        
        console.log(`生成了31天的作息表`);
    }, 500);
}

// 创建作息表格
function createScheduleTable(daysInMonth) {
    const table = document.createElement('table');
    table.id = 'scheduleTable';
    
    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // 时间列表头
    const timeHeader = document.createElement('th');
    timeHeader.textContent = '时间';
    timeHeader.style.width = '35px';
    timeHeader.style.minWidth = '35px';
    headerRow.appendChild(timeHeader);
    
    // 标准作息列表头
    const standardHeader = document.createElement('th');
    standardHeader.textContent = '标准作息';
    standardHeader.style.width = '60px';
    standardHeader.style.minWidth = '60px';
    headerRow.appendChild(standardHeader);
    
    // 日期列表头（1-31日，不显示星期）
    for (let day = 1; day <= daysInMonth; day++) {
        const dayHeader = document.createElement('th');
        dayHeader.textContent = day;
        dayHeader.style.width = '34px';
        dayHeader.style.minWidth = '30px';
        headerRow.appendChild(dayHeader);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // 创建表格主体
    const tbody = document.createElement('tbody');
    
    // 生成时间行
    const times = Object.keys(standardSchedule);
    times.forEach((time, index) => {
        const row = document.createElement('tr');
        
        // 时间列（可编辑）
        const timeCell = document.createElement('td');
        timeCell.textContent = time;
        timeCell.contentEditable = true;
        timeCell.style.fontWeight = 'bold';
        timeCell.style.backgroundColor = '#e8f5e8';
        timeCell.style.width = '35px';
        timeCell.style.minWidth = '35px';
        timeCell.style.textAlign = 'center';
        timeCell.style.fontSize = '9px';
        timeCell.style.cursor = 'text';
        timeCell.setAttribute('data-type', 'time');
        timeCell.setAttribute('data-row', index);
        timeCell.setAttribute('data-cell-id', `time-${index}`);
        
        // 添加单元格选择事件
        timeCell.addEventListener('mousedown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                toggleCellSelection(this);
            } else {
                // 正常编辑模式
            }
        });
        
        timeCell.addEventListener('mouseenter', function() {
            if (isSelecting) {
                this.classList.add('cell-selecting');
            }
        });
        
        timeCell.addEventListener('mouseleave', function() {
            this.classList.remove('cell-selecting');
        });
        
        // 添加编辑事件
        timeCell.addEventListener('focus', function() {
            this.style.backgroundColor = '#e3f2fd';
            this.style.outline = '2px solid #2196f3';
        });
        
        timeCell.addEventListener('blur', function() {
            this.style.backgroundColor = '#e8f5e8';
            this.style.outline = 'none';
            saveSpecialCellData('time', index, this.textContent.trim());
        });
        
        row.appendChild(timeCell);
        
        // 标准作息列（可编辑）
        const standardCell = document.createElement('td');
        standardCell.textContent = standardSchedule[time];
        standardCell.contentEditable = true;
        standardCell.style.fontSize = '9px';
        standardCell.style.backgroundColor = '#fff8e1';
        standardCell.style.width = '60px';
        standardCell.style.minWidth = '60px';
        standardCell.style.padding = '2px';
        standardCell.style.textAlign = 'center';
        standardCell.style.lineHeight = '1.1';
        standardCell.style.wordWrap = 'break-word';
        standardCell.style.color = '#e65100';
        standardCell.style.fontWeight = '500';
        standardCell.style.cursor = 'text';
        standardCell.setAttribute('data-type', 'standard');
        standardCell.setAttribute('data-row', index);
        standardCell.setAttribute('data-cell-id', `standard-${index}`);
        
        // 添加单元格选择事件
        standardCell.addEventListener('mousedown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                toggleCellSelection(this);
            } else {
                // 正常编辑模式
            }
        });
        
        standardCell.addEventListener('mouseenter', function() {
            if (isSelecting) {
                this.classList.add('cell-selecting');
            }
        });
        
        standardCell.addEventListener('mouseleave', function() {
            this.classList.remove('cell-selecting');
        });
        
        // 添加编辑事件
        standardCell.addEventListener('focus', function() {
            this.style.backgroundColor = '#e3f2fd';
            this.style.outline = '2px solid #2196f3';
        });
        
        standardCell.addEventListener('blur', function() {
            this.style.backgroundColor = '#fff8e1';
            this.style.outline = 'none';
            saveSpecialCellData('standard', index, this.textContent.trim());
        });
        
        row.appendChild(standardCell);
        
        // 日期列（用于记录实际作息）
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('td');
            dayCell.style.minHeight = '38px';
            dayCell.style.height = '38px';
            dayCell.style.border = '1px solid #ddd';
            dayCell.style.fontSize = '10px';
            dayCell.style.padding = '3px';
            dayCell.style.wordWrap = 'break-word';
            dayCell.style.overflow = 'hidden';
            dayCell.style.verticalAlign = 'top';
            dayCell.style.width = '34px';
            dayCell.style.minWidth = '30px';
            dayCell.contentEditable = true; // 可编辑
            dayCell.style.cursor = 'text';
            dayCell.setAttribute('data-day', day);
            dayCell.setAttribute('data-row', index);
            dayCell.setAttribute('data-cell-id', `${index}-${day}`);
            
            // 添加编辑提示
            dayCell.title = `点击记录第${day}日的实际作息`;
            
            // 添加单元格选择事件
            dayCell.addEventListener('mousedown', function(e) {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    toggleCellSelection(this);
                } else {
                    // 正常编辑模式
                }
            });
            
            dayCell.addEventListener('mouseenter', function() {
                if (isSelecting) {
                    this.classList.add('cell-selecting');
                }
            });
            
            dayCell.addEventListener('mouseleave', function() {
                this.classList.remove('cell-selecting');
            });
            
            // 添加编辑事件
            dayCell.addEventListener('focus', function() {
                this.style.backgroundColor = '#e3f2fd';
                this.style.outline = '2px solid #2196f3';
            });
            
            dayCell.addEventListener('blur', function() {
                this.style.backgroundColor = this.textContent.trim() ? '#c8e6c9' : '';
                this.style.outline = 'none';
                // 保存数据
                saveCellData(day, index, this.textContent.trim());
            });
            
            dayCell.addEventListener('input', function() {
                // 实时保存
                saveCellData(day, index, this.textContent.trim());
            });
            
            row.appendChild(dayCell);
        }
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    return table;
}

// 创建育儿建议区域
function createParentingTips() {
    const parentingTips = document.createElement('div');
    parentingTips.className = 'parenting-tips';
    
    // 移除标题，直接显示技巧网格
    
    const tipsGrid = document.createElement('div');
    tipsGrid.className = 'tips-grid';
    
    const tipsData = [
        {
            title: '固定作息',
            content: '每天同一时间起床、吃饭、睡觉\n坚持3-4周形成习惯'
        },
        {
            title: '饮食规律',
            content: '三餐两点定时定量\n睡前2小时不进食'
        },
        {
            title: '活动安排',
            content: '上午高强度活动，下午安静游戏\n每天户外活动至少1小时'
        },
        {
            title: '睡前仪式',
            content: '洗澡→刷牙→故事→拥抱\n固定流程助入睡'
        },
        {
            title: '午睡时间',
            content: '13:00-15:00午睡1-2小时\n过晚或过长影响夜间睡眠'
        },
        {
            title: '奖励机制',
            content: '完成作息目标给予表扬\n正向强化好习惯'
        },
        {
            title: '睡眠环境',
            content: '睡前1小时调暗灯光\n室温18-22℃，保持安静'
        },
        {
            title: '耐心坚持',
            content: '每个孩子节奏不同\n记录作息有助发现规律'
        }
    ];
    
    tipsData.forEach((tip, index) => {
        const tipCard = document.createElement('div');
        tipCard.className = 'tip-card';
        
        const tipTitle = document.createElement('h4');
        tipTitle.textContent = tip.title;
        tipTitle.contentEditable = true;
        tipTitle.style.cursor = 'text';
        tipTitle.setAttribute('data-tip-index', index);
        tipTitle.setAttribute('data-tip-type', 'title');
        
        // 添加编辑事件
        tipTitle.addEventListener('focus', function() {
            this.style.backgroundColor = '#e3f2fd';
            this.style.outline = '2px solid #2196f3';
        });
        
        tipTitle.addEventListener('blur', function() {
            this.style.backgroundColor = '';
            this.style.outline = 'none';
            saveTipData(index, 'title', this.textContent.trim());
        });
        
        tipCard.appendChild(tipTitle);
        
        const tipContent = document.createElement('p');
        tipContent.textContent = tip.content;
        tipContent.contentEditable = true;
        tipContent.style.cursor = 'text';
        tipContent.setAttribute('data-tip-index', index);
        tipContent.setAttribute('data-tip-type', 'content');
        
        // 添加编辑事件
        tipContent.addEventListener('focus', function() {
            this.style.backgroundColor = '#e3f2fd';
            this.style.outline = '2px solid #2196f3';
        });
        
        tipContent.addEventListener('blur', function() {
            this.style.backgroundColor = '';
            this.style.outline = 'none';
            saveTipData(index, 'content', this.textContent.trim());
        });
        
        tipCard.appendChild(tipContent);
        
        tipsGrid.appendChild(tipCard);
    });
    
    parentingTips.appendChild(tipsGrid);
    
    return parentingTips;
}

// 保存标题数据
function saveTitleData(content) {
    localStorage.setItem('schedule-title', content);
}

// 保存技巧卡片数据
function saveTipData(index, type, content) {
    let data = JSON.parse(localStorage.getItem('schedule-tips') || '{}');
    if (!data[index]) {
        data[index] = {};
    }
    data[index][type] = content;
    localStorage.setItem('schedule-tips', JSON.stringify(data));
}

// 保存特殊单元格数据（时间和标准作息列）
function saveSpecialCellData(type, row, content) {
    let data = JSON.parse(localStorage.getItem('schedule-special') || '{}');
    if (!data[type]) {
        data[type] = {};
    }
    data[type][row] = content;
    localStorage.setItem('schedule-special', JSON.stringify(data));
}

// 保存单元格数据（简化版）
function saveCellData(day, row, content) {
    let data = JSON.parse(localStorage.getItem('schedule-data') || '{}');
    if (!data[day]) {
        data[day] = {};
    }
    data[day][row] = content;
    localStorage.setItem('schedule-data', JSON.stringify(data));
}

// 恢复表格数据（简化版）
function restoreTableData() {
    // 恢复标题
    const savedTitle = localStorage.getItem('schedule-title');
    if (savedTitle) {
        document.getElementById('titleInput').value = savedTitle;
    }
    
    // 恢复特殊列数据
    const specialData = JSON.parse(localStorage.getItem('schedule-special') || '{}');
    
    // 恢复时间列
    if (specialData.time) {
        Object.keys(specialData.time).forEach(row => {
            const cell = document.querySelector(`[data-type="time"][data-row="${row}"]`);
            if (cell) {
                cell.textContent = specialData.time[row];
            }
        });
    }
    
    // 恢复标准作息列
    if (specialData.standard) {
        Object.keys(specialData.standard).forEach(row => {
            const cell = document.querySelector(`[data-type="standard"][data-row="${row}"]`);
            if (cell) {
                cell.textContent = specialData.standard[row];
            }
        });
    }
    
    // 恢复日期列数据
    const cellData = JSON.parse(localStorage.getItem('schedule-data') || '{}');
    Object.keys(cellData).forEach(day => {
        Object.keys(cellData[day]).forEach(row => {
            const cell = document.querySelector(`[data-day="${day}"][data-row="${row}"]`);
            if (cell) {
                cell.textContent = cellData[day][row];
                if (cellData[day][row].trim()) {
                    cell.style.backgroundColor = '#c8e6c9';
                }
            }
        });
    });
    
    // 恢复技巧卡片数据
    const tipsData = JSON.parse(localStorage.getItem('schedule-tips') || '{}');
    Object.keys(tipsData).forEach(index => {
        if (tipsData[index].title) {
            const titleElement = document.querySelector(`[data-tip-index="${index}"][data-tip-type="title"]`);
            if (titleElement) {
                titleElement.textContent = tipsData[index].title;
            }
        }
        if (tipsData[index].content) {
            const contentElement = document.querySelector(`[data-tip-index="${index}"][data-tip-type="content"]`);
            if (contentElement) {
                contentElement.textContent = tipsData[index].content;
            }
        }
    });
}

// 加载保存的数据
function loadSavedData() {
    try {
        console.log('📁 已加载保存的数据');
    } catch (error) {
        console.error('❌ 加载数据失败:', error);
    }
}

// 切换预览模式
function togglePreviewMode() {
    const container = document.querySelector('.container');
    const previewBtn = document.getElementById('previewBtn');
    
    if (!document.getElementById('scheduleTable')) {
        alert('请先生成表格');
        return;
    }
    
    isPreviewMode = !isPreviewMode;
    
    if (isPreviewMode) {
        container.classList.add('print-preview');
        previewBtn.textContent = '退出预览';
        previewBtn.className = 'btn btn-info';
        
        // 滚动到表格顶部
        document.getElementById('tableContainer').scrollIntoView({ behavior: 'smooth' });
        
        console.log('进入预览模式');
    } else {
        container.classList.remove('print-preview');
        previewBtn.textContent = '预览打印';
        previewBtn.className = 'btn btn-info';
        
        console.log('退出预览模式');
    }
}

// 导出为PDF
function exportToPDF() {
    const table = document.getElementById('scheduleTable');
    if (!table) {
        alert('请先生成表格');
        return;
    }
    
    // 显示导出状态
    const exportBtn = document.getElementById('exportBtn');
    const originalText = exportBtn.textContent;
    exportBtn.textContent = '正在导出...';
    exportBtn.disabled = true;
    
    // 检查是否加载了jsPDF和html2canvas
    if (typeof window.jsPDF === 'undefined' || typeof html2canvas === 'undefined') {
        console.warn('PDF导出库未加载，使用浏览器打印功能');
        printTable();
        
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
        return;
    }
    
    try {
        // 临时进入预览模式以获得最佳导出效果
        const wasInPreview = isPreviewMode;
        if (!wasInPreview) {
            document.querySelector('.container').classList.add('print-preview');
        }
        
        // 使用html2canvas和jsPDF导出
        const element = document.querySelector('.container');
        
        html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: element.scrollWidth,
            height: element.scrollHeight
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new window.jsPDF('l', 'mm', 'a4'); // 横向A4
            
            const imgWidth = 297; // A4横向宽度
            const pageHeight = 210; // A4横向高度
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            const titleInput = document.getElementById('titleInput').value || '嘉航作息表';
            const filename = `${titleInput}.pdf`;
            
            pdf.save(filename);
            
            console.log(`PDF导出成功: ${filename}`);
            
            // 恢复预览状态
            if (!wasInPreview) {
                document.querySelector('.container').classList.remove('print-preview');
            }
            
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }).catch(error => {
            console.error('PDF导出失败:', error);
            alert('PDF导出失败，将使用浏览器打印功能');
            printTable();
            
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        });
        
    } catch (error) {
        console.error('PDF导出异常:', error);
        alert('PDF导出功能异常，将使用浏览器打印功能');
        printTable();
        
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
    }
}

// 使用浏览器打印功能
function printTable() {
    // 临时进入预览模式
    const wasInPreview = isPreviewMode;
    if (!wasInPreview) {
        document.querySelector('.container').classList.add('print-preview');
    }
    
    // 延迟打印以确保样式生效
    setTimeout(() => {
        window.print();
        
        // 打印后恢复状态
        if (!wasInPreview) {
            document.querySelector('.container').classList.remove('print-preview');
        }
    }, 100);
}

// 初始化欢迎弹窗事件绑定
function initWelcomeModal() {
    // 防止重复绑定
    if (modalEventsInitialized) {
        console.log('🔧 欢迎弹窗事件已经绑定过了');
        return;
    }
    
    const modal = document.getElementById('welcomeModal');
    const closeBtn = document.getElementById('closeModal');
    const startBtn = document.getElementById('startUsingBtn');
    
    // 确保元素存在
    if (!modal || !closeBtn || !startBtn) {
        console.error('❌ 欢迎弹窗元素未找到');
        return;
    }
    
    // 绑定关闭事件
    closeBtn.addEventListener('click', closeWelcomeModal);
    startBtn.addEventListener('click', closeWelcomeModal);
    
    // 点击遮罩层关闭
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeWelcomeModal();
        }
    });
    
    modalEventsInitialized = true;
    console.log('🔧 欢迎弹窗事件绑定完成');
}

// 显示欢迎弹窗
function showWelcomeModal() {
    // 检查是否是首次访问（或者清除了localStorage）
    const hasSeenWelcome = localStorage.getItem('schedule-welcome-seen');
    
    // 如果没有看过欢迎提示，或者是首次访问，则显示弹窗
    if (!hasSeenWelcome) {
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // ESC键关闭功能
            const escapeHandler = function(event) {
                if (event.key === 'Escape') {
                    closeWelcomeModal();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
            
            console.log('🎉 显示欢迎弹窗');
        } else {
            console.error('❌ 欢迎弹窗元素未找到');
        }
    } else {
        console.log('👋 用户已看过欢迎提示');
    }
}

// 关闭欢迎弹窗
function closeWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    modal.style.display = 'none';
    
    // 标记用户已看过欢迎提示
    localStorage.setItem('schedule-welcome-seen', 'true');
    
    console.log('📝 欢迎弹窗已关闭');
    
    // 调试用：添加一个隐藏的测试功能，双击标题可以重置弹窗状态
    const titleInput = document.getElementById('titleInput');
    if (titleInput && !titleInput.hasAttribute('data-test-listener')) {
        titleInput.addEventListener('dblclick', function() {
            if (confirm('是否重置欢迎弹窗状态？（仅用于测试）')) {
                localStorage.removeItem('schedule-welcome-seen');
                console.log('🧪 已重置欢迎弹窗状态，刷新页面后可重新显示');
                alert('已重置弹窗状态，请刷新页面测试');
            }
        });
        titleInput.setAttribute('data-test-listener', 'true');
    }
}

// 添加键盘快捷键支持
document.addEventListener('keydown', function(event) {
    // Ctrl+P 或 Cmd+P 触发打印预览
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        if (!isPreviewMode) {
            togglePreviewMode();
        }
    }
    
    // Esc键退出预览模式
    if (event.key === 'Escape' && isPreviewMode) {
        togglePreviewMode();
    }
    
    // Ctrl+S 保存数据
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        console.log('💾 数据已自动保存');
    }
});

// 页面卸载前的提示（如果有未保存的数据）
window.addEventListener('beforeunload', function(event) {
    const table = document.getElementById('scheduleTable');
    if (table) {
        const editableCells = table.querySelectorAll('td[contenteditable="true"]');
        const hasContent = Array.from(editableCells).some(cell => cell.textContent.trim());
        
        if (hasContent) {
            const message = '您有未保存的作息记录，确定要离开吗？';
            event.returnValue = message;
            return message;
        }
    }
});

// 工具函数
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getWeekday(year, month, day) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const date = new Date(year, month - 1, day);
    return weekdays[date.getDay()];
}

console.log('🎯 嘉航作息表脚本已加载完成');

// ===== 新增功能函数 =====

// 单元格选择功能
function toggleCellSelection(cell) {
    const cellId = cell.getAttribute('data-cell-id');
    const index = selectedCells.indexOf(cellId);
    
    if (index > -1) {
        // 取消选择
        selectedCells.splice(index, 1);
        cell.classList.remove('cell-selected');
    } else {
        // 添加选择
        selectedCells.push(cellId);
        cell.classList.add('cell-selected');
    }
    
    updateSelectionInfo();
    updateToolbarButtons();
}

// 更新选择信息显示
function updateSelectionInfo() {
    const selectionInfo = document.getElementById('selectionInfo');
    if (selectedCells.length > 0) {
        selectionInfo.textContent = `已选择 ${selectedCells.length} 个单元格`;
    } else {
        selectionInfo.textContent = '';
    }
}

// 更新工具栏按钮状态
function updateToolbarButtons() {
    const mergeCellsBtn = document.getElementById('mergeCellsBtn');
    const unmergeCellsBtn = document.getElementById('unmergeCellsBtn');
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');
    
    mergeCellsBtn.disabled = selectedCells.length < 2;
    clearSelectionBtn.disabled = selectedCells.length === 0;
    
    // 检查是否有选中的单元格已经被合并
    const hasSelectedMergedCells = selectedCells.some(cellId => {
        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        return cell && cell.classList.contains('merged-cell');
    });
    unmergeCellsBtn.disabled = !hasSelectedMergedCells;
}

// 合并单元格
function mergeCells() {
    if (selectedCells.length < 2) {
        alert('请至少选择2个单元格进行合并');
        return;
    }
    
    // 找到所有选中的单元格
    const cells = selectedCells.map(cellId => 
        document.querySelector(`[data-cell-id="${cellId}"]`)
    ).filter(cell => cell !== null);
    
    if (cells.length !== selectedCells.length) {
        alert('选择的单元格中有无效的，请重新选择');
        return;
    }
    
    // 分析单元格位置，计算合并区域
    const cellPositions = cells.map(cell => {
        let row = parseInt(cell.getAttribute('data-row'));
        let col = 0;
        
        const cellId = cell.getAttribute('data-cell-id');
        if (cellId.startsWith('time-')) {
            col = 0; // 时间列
        } else if (cellId.startsWith('standard-')) {
            col = 1; // 标准作息列
        } else {
            // 日期列
            const day = parseInt(cell.getAttribute('data-day'));
            col = day + 1; // 日期列从第3列开始
        }
        
        return { cell, row, col, cellId };
    });
    
    // 找到合并区域的边界
    const minRow = Math.min(...cellPositions.map(p => p.row));
    const maxRow = Math.max(...cellPositions.map(p => p.row));
    const minCol = Math.min(...cellPositions.map(p => p.col));
    const maxCol = Math.max(...cellPositions.map(p => p.col));
    
    // 检查是否是矩形区域
    const expectedCells = (maxRow - minRow + 1) * (maxCol - minCol + 1);
    if (cells.length !== expectedCells) {
        alert('只能合并矩形区域的单元格，请重新选择');
        return;
    }
    
    // 验证选中的单元格是否形成完整的矩形
    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            let expectedCellId;
            if (col === 0) {
                expectedCellId = `time-${row}`;
            } else if (col === 1) {
                expectedCellId = `standard-${row}`;
            } else {
                expectedCellId = `${row}-${col - 1}`;
            }
            
            const found = cellPositions.some(p => p.cellId === expectedCellId);
            if (!found) {
                alert('选择的单元格不是完整的矩形区域，请重新选择');
                return;
            }
        }
    }
    
    // 收集所有单元格的内容
    const contents = cells.map(cell => cell.textContent.trim()).filter(content => content);
    const combinedContent = contents.join(' | ');
    
    // 找到左上角的单元格作为主单元格（最小行列）
    const mainPosition = cellPositions.find(p => p.row === minRow && p.col === minCol);
    const mainCell = mainPosition.cell;
    
    // 设置合并属性
    const rowSpan = maxRow - minRow + 1;
    const colSpan = maxCol - minCol + 1;
    
    mainCell.rowSpan = rowSpan;
    mainCell.colSpan = colSpan;
    mainCell.textContent = combinedContent;
    mainCell.classList.add('merged-cell');
    
    // 隐藏其他单元格
    const otherCells = cells.filter(cell => cell !== mainCell);
    otherCells.forEach(cell => {
        cell.style.display = 'none';
        cell.classList.add('merged-hidden');
    });
    
    // 记录合并信息
    const mergeId = `merge-${Date.now()}`;
    mergedCells.set(mergeId, {
        mainCellId: mainCell.getAttribute('data-cell-id'),
        hiddenCellIds: otherCells.map(cell => cell.getAttribute('data-cell-id')),
        rowSpan,
        colSpan,
        minRow,
        maxRow,
        minCol,
        maxCol,
        originalContents: cells.map(cell => ({ 
            id: cell.getAttribute('data-cell-id'),
            content: cell.textContent.trim() 
        }))
    });
    
    mainCell.setAttribute('data-merge-id', mergeId);
    
    // 清除选择
    clearSelection();
    
    console.log('单元格合并完成:', mergeId, `${rowSpan}x${colSpan}`);
}

// 取消合并单元格
function unmergeCells() {
    const selectedMergedCells = selectedCells.filter(cellId => {
        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        return cell && cell.classList.contains('merged-cell');
    });
    
    if (selectedMergedCells.length === 0) {
        alert('请选择已合并的单元格');
        return;
    }
    
    selectedMergedCells.forEach(cellId => {
        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        const mergeId = cell.getAttribute('data-merge-id');
        
        if (mergeId && mergedCells.has(mergeId)) {
            const mergeInfo = mergedCells.get(mergeId);
            
            // 恢复主单元格
            cell.classList.remove('merged-cell');
            cell.removeAttribute('data-merge-id');
            cell.rowSpan = 1;
            cell.colSpan = 1;
            
            // 显示隐藏的单元格
            mergeInfo.hiddenCellIds.forEach(hiddenCellId => {
                const hiddenCell = document.querySelector(`[data-cell-id="${hiddenCellId}"]`);
                if (hiddenCell) {
                    hiddenCell.style.display = '';
                    hiddenCell.classList.remove('merged-hidden');
                }
            });
            
            // 恢复原始内容（可选）
            // mergeInfo.originalContents.forEach(original => {
            //     const originalCell = document.querySelector(`[data-cell-id="${original.id}"]`);
            //     if (originalCell) {
            //         originalCell.textContent = original.content;
            //     }
            // });
            
            // 删除合并记录
            mergedCells.delete(mergeId);
            
            console.log('取消合并:', mergeId);
        }
    });
    
    clearSelection();
}

// 清除选择
function clearSelection() {
    selectedCells.forEach(cellId => {
        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        if (cell) {
            cell.classList.remove('cell-selected');
        }
    });
    
    selectedCells = [];
    updateSelectionInfo();
    updateToolbarButtons();
}

// 保存当前表格到KV
async function saveCurrentTable() {
    const table = document.getElementById('scheduleTable');
    if (!table) {
        alert('请先生成表格');
        return;
    }
    
    // 显示保存状态
    const saveBtn = document.getElementById('saveTableBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '保存中...';
    saveBtn.disabled = true;
    
    try {
        // 生成唯一ID
        const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // 生成默认标题（精确到秒的时间）
        const now = new Date();
        const defaultTitle = `嘉航作息表-${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        // 收集所有数据
        const cellData = JSON.parse(localStorage.getItem('schedule-data') || '{}');
        const specialData = JSON.parse(localStorage.getItem('schedule-special') || '{}');
        const tipsData = JSON.parse(localStorage.getItem('schedule-tips') || '{}');
        const scheduleSource = document.getElementById('scheduleSource').textContent;
        const titleContent = document.getElementById('titleInput').value;
        const headerSource = document.getElementById('headerScheduleSource').textContent;
        
        const saveData = {
            id: tableId,
            title: defaultTitle,
            titleContent,
            headerSource,
            cellData,
            specialData,
            tipsData,
            scheduleSource,
            mergedCells: Object.fromEntries(mergedCells),
            userId: currentUserId
        };
        
        // 调用API保存
        const response = await fetch('/api/tables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'save',
                data: saveData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`表格保存成功！标题：${defaultTitle}`);
            // 刷新保存列表
            loadSavedTables();
        } else {
            throw new Error(result.error || '保存失败');
        }
        
    } catch (error) {
        console.error('保存表格失败:', error);
        alert(`保存失败：${error.message}`);
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// 加载已保存的表格列表
async function loadSavedTables() {
    try {
        const response = await fetch('/api/tables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'list',
                data: { userId: currentUserId }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displaySavedTables(result.data);
        } else {
            console.error('获取表格列表失败:', result.error);
        }
        
    } catch (error) {
        console.error('加载表格列表失败:', error);
    }
}

// 显示已保存的表格列表
function displaySavedTables(tables) {
    const recordsList = document.getElementById('recordsList');
    const savedRecords = document.getElementById('savedRecords');
    
    if (tables.length === 0) {
        recordsList.innerHTML = '<p class="no-records">暂无保存记录</p>';
        savedRecords.style.display = 'none';
        return;
    }
    
    savedRecords.style.display = 'block';
    
    recordsList.innerHTML = tables.map(table => `
        <div class="record-item">
            <div class="record-info">
                <input type="text" 
                       class="record-title" 
                       value="${table.title}" 
                       data-table-id="${table.id}"
                       onblur="updateTableTitle('${table.id}', this.value)">
                <div class="record-date">
                    创建时间: ${new Date(table.createdAt).toLocaleString('zh-CN')}
                    ${table.updatedAt !== table.createdAt ? 
                        `<br>更新时间: ${new Date(table.updatedAt).toLocaleString('zh-CN')}` : 
                        ''}
                </div>
            </div>
            <div class="record-actions">
                <button class="btn-small btn-load" onclick="loadSavedTable('${table.id}')">
                    加载
                </button>
                <button class="btn-small btn-delete" onclick="deleteSavedTable('${table.id}')">
                    删除
                </button>
            </div>
        </div>
    `).join('');
}

// 加载已保存的表格
async function loadSavedTable(tableId) {
    if (!confirm('加载表格将覆盖当前数据，是否继续？')) {
        return;
    }
    
    try {
        const response = await fetch('/api/tables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'load',
                data: { id: tableId }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const tableData = result.data;
            
            // 恢复数据到localStorage
            localStorage.setItem('schedule-data', JSON.stringify(tableData.cellData || {}));
            localStorage.setItem('schedule-special', JSON.stringify(tableData.specialData || {}));
            localStorage.setItem('schedule-tips', JSON.stringify(tableData.tipsData || {}));
            
            // 恢复标准作息来源
            if (tableData.scheduleSource) {
                document.getElementById('scheduleSource').textContent = tableData.scheduleSource;
            }
            
            // 恢复标题和头部来源信息
            if (tableData.titleContent) {
                document.getElementById('titleInput').value = tableData.titleContent;
            }
            if (tableData.headerSource) {
                document.getElementById('headerScheduleSource').textContent = tableData.headerSource;
            }
            
            // 恢复合并单元格信息
            if (tableData.mergedCells) {
                mergedCells.clear();
                Object.entries(tableData.mergedCells).forEach(([key, value]) => {
                    mergedCells.set(key, value);
                });
            }
            
            // 重新生成表格
            generateScheduleTable();
            
            alert('表格加载成功！');
            
        } else {
            throw new Error(result.error || '加载失败');
        }
        
    } catch (error) {
        console.error('加载表格失败:', error);
        alert(`加载失败：${error.message}`);
    }
}

// 删除已保存的表格
async function deleteSavedTable(tableId) {
    if (!confirm('确定要删除这个表格吗？此操作不可恢复。')) {
        return;
    }
    
    try {
        const response = await fetch('/api/tables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete',
                data: { id: tableId }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('表格删除成功！');
            // 刷新保存列表
            loadSavedTables();
        } else {
            throw new Error(result.error || '删除失败');
        }
        
    } catch (error) {
        console.error('删除表格失败:', error);
        alert(`删除失败：${error.message}`);
    }
}

// 更新表格标题
async function updateTableTitle(tableId, newTitle) {
    if (!newTitle.trim()) {
        return;
    }
    
    try {
        const response = await fetch('/api/tables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'updateTitle',
                data: { id: tableId, title: newTitle.trim() }
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('更新标题失败:', result.error);
            alert('更新标题失败');
        }
        
    } catch (error) {
        console.error('更新标题失败:', error);
    }
}

// 保存标准作息来源
function saveScheduleSource(content) {
    localStorage.setItem('schedule-source', content);
}

// 恢复标准作息来源
function restoreScheduleSource() {
    const savedSource = localStorage.getItem('schedule-source');
    if (savedSource) {
        const sourceElement = document.getElementById('scheduleSource');
        if (sourceElement) {
            sourceElement.textContent = savedSource;
        }
    }
}

// 在页面加载时恢复标准作息来源
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        restoreScheduleSource();
    }, 100);
}); 