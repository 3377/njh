/**
 * Cloudflare Pages Functions for KV storage
 * 处理嘉航作息表的数据存储
 */

// KV命名空间绑定名称，需要在Cloudflare Pages中配置
// 在Pages设置中将KV命名空间绑定为 SCHEDULE_TABLES

export async function onRequestPost({ request, env }) {
  try {
    const { action, data } = await request.json();
    
    switch (action) {
      case 'save':
        return await saveTable(env, data);
      case 'load':
        return await loadTable(env, data.id);
      case 'delete':
        return await deleteTable(env, data.id);
      case 'list':
        return await listTables(env, data.userId);
      case 'updateTitle':
        return await updateTableTitle(env, data.id, data.title);
      default:
        return new Response(JSON.stringify({ error: '无效的操作' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('KV操作错误:', error);
    return new Response(JSON.stringify({ 
      error: '服务器错误',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 保存表格数据
async function saveTable(env, data) {
  try {
    const { id, title, tableData, cellData, specialData, tipsData, scheduleSource, headerScheduleSource, userId = 'default' } = data;
    
    const tableInfo = {
      id,
      title,
      tableData,
      cellData,
      specialData,
      tipsData,
      scheduleSource,
      headerScheduleSource,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 保存表格数据
    await env.SCHEDULE_TABLES.put(`table:${id}`, JSON.stringify(tableInfo));
    
    // 更新用户的表格列表
    const userTablesKey = `user:${userId}:tables`;
    let userTables = [];
    try {
      const existingTables = await env.SCHEDULE_TABLES.get(userTablesKey);
      if (existingTables) {
        userTables = JSON.parse(existingTables);
      }
    } catch (e) {
      console.warn('读取用户表格列表失败:', e);
    }
    
    // 检查是否已存在，如果存在则更新，否则添加
    const existingIndex = userTables.findIndex(table => table.id === id);
    const tableMetadata = {
      id,
      title,
      createdAt: tableInfo.createdAt,
      updatedAt: tableInfo.updatedAt
    };
    
    if (existingIndex >= 0) {
      userTables[existingIndex] = tableMetadata;
    } else {
      userTables.unshift(tableMetadata); // 最新的放在前面
    }
    
    // 限制最多保存50个表格
    if (userTables.length > 50) {
      userTables = userTables.slice(0, 50);
    }
    
    await env.SCHEDULE_TABLES.put(userTablesKey, JSON.stringify(userTables));
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: '表格保存成功',
      tableId: id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('保存表格失败:', error);
    return new Response(JSON.stringify({ 
      error: '保存失败',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 读取表格数据
async function loadTable(env, tableId) {
  try {
    const tableData = await env.SCHEDULE_TABLES.get(`table:${tableId}`);
    
    if (!tableData) {
      return new Response(JSON.stringify({ 
        error: '表格不存在' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      data: JSON.parse(tableData)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('读取表格失败:', error);
    return new Response(JSON.stringify({ 
      error: '读取失败',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 删除表格
async function deleteTable(env, tableId) {
  try {
    // 首先读取表格信息获取用户ID
    const tableData = await env.SCHEDULE_TABLES.get(`table:${tableId}`);
    if (!tableData) {
      return new Response(JSON.stringify({ 
        error: '表格不存在' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const tableInfo = JSON.parse(tableData);
    const userId = tableInfo.userId || 'default';
    
    // 删除表格数据
    await env.SCHEDULE_TABLES.delete(`table:${tableId}`);
    
    // 从用户表格列表中移除
    const userTablesKey = `user:${userId}:tables`;
    try {
      const userTablesData = await env.SCHEDULE_TABLES.get(userTablesKey);
      if (userTablesData) {
        let userTables = JSON.parse(userTablesData);
        userTables = userTables.filter(table => table.id !== tableId);
        await env.SCHEDULE_TABLES.put(userTablesKey, JSON.stringify(userTables));
      }
    } catch (e) {
      console.warn('更新用户表格列表失败:', e);
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: '表格删除成功'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('删除表格失败:', error);
    return new Response(JSON.stringify({ 
      error: '删除失败',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取用户的表格列表
async function listTables(env, userId = 'default') {
  try {
    const userTablesKey = `user:${userId}:tables`;
    const userTablesData = await env.SCHEDULE_TABLES.get(userTablesKey);
    
    if (!userTablesData) {
      return new Response(JSON.stringify({ 
        success: true,
        data: []
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userTables = JSON.parse(userTablesData);
    
    return new Response(JSON.stringify({ 
      success: true,
      data: userTables
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('获取表格列表失败:', error);
    return new Response(JSON.stringify({ 
      error: '获取列表失败',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 更新表格标题
async function updateTableTitle(env, tableId, newTitle) {
  try {
    const tableData = await env.SCHEDULE_TABLES.get(`table:${tableId}`);
    if (!tableData) {
      return new Response(JSON.stringify({ 
        error: '表格不存在' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const tableInfo = JSON.parse(tableData);
    tableInfo.title = newTitle;
    tableInfo.updatedAt = new Date().toISOString();
    
    // 更新表格数据
    await env.SCHEDULE_TABLES.put(`table:${tableId}`, JSON.stringify(tableInfo));
    
    // 更新用户表格列表中的标题
    const userId = tableInfo.userId || 'default';
    const userTablesKey = `user:${userId}:tables`;
    try {
      const userTablesData = await env.SCHEDULE_TABLES.get(userTablesKey);
      if (userTablesData) {
        let userTables = JSON.parse(userTablesData);
        const tableIndex = userTables.findIndex(table => table.id === tableId);
        if (tableIndex >= 0) {
          userTables[tableIndex].title = newTitle;
          userTables[tableIndex].updatedAt = tableInfo.updatedAt;
          await env.SCHEDULE_TABLES.put(userTablesKey, JSON.stringify(userTables));
        }
      }
    } catch (e) {
      console.warn('更新用户表格列表标题失败:', e);
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: '标题更新成功'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('更新标题失败:', error);
    return new Response(JSON.stringify({ 
      error: '更新失败',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理CORS预检请求
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 