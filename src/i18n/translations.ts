export type Language = 'en' | 'zh';

export const translations = {
  en: {
    app: {
      title: 'Sprite Slicer',
    },
    settings: {
      title: 'Settings',
      grid: 'Grid Layout',
      rows: 'Rows',
      cols: 'Columns',
      detect: 'Auto Detect',
      detecting: 'Detecting...',
      numbering: 'Numbering',
      startId: 'Start ID',
      fontSize: 'Font Size',
      sorting: 'Sorting Order',
      pattern: 'Pattern',
    },
    sort: {
      normal: 'Normal (L-R, T-B)',
      snake1: 'Snake (Odd L-R, Even R-L)',
      snake2: 'Snake (Even L-R, Odd R-L)',
      reverse: 'Reverse (R-L, B-T)',
    },
    dropzone: {
      drop: 'Drop image here',
      drag: 'Drag & Drop image here',
      support: 'Support for PNG, JPEG, GIF, WebP.',
      local: 'Images are processed locally in your browser.',
      select: 'Select File',
    },
    history: {
      title: 'History',
      clear: 'Clear History',
      grid: 'Grid',
    },
    action: {
      slice: 'Slice & Download',
      processing: 'Processing...',
    },
    sidebar: {
      noFile: 'Upload an image to start slicing',
    },
  },
  zh: {
    app: {
      title: '精灵图切割',
    },
    settings: {
      title: '设置',
      grid: '网格布局',
      rows: '行数',
      cols: '列数',
      detect: '自动识别',
      detecting: '识别中...',
      numbering: '序号标注',
      startId: '起始序号',
      fontSize: '字体大小',
      sorting: '排序方式',
      pattern: '模式',
    },
    sort: {
      normal: '正常 (从左到右，从上到下)',
      snake1: '蛇形 (奇数行左到右，偶数行右到左)',
      snake2: '蛇形 (偶数行左到右，奇数行右到左)',
      reverse: '倒序 (从右到左，从下到上)',
    },
    dropzone: {
      drop: '松开以上传',
      drag: '拖拽图片到此处',
      support: '支持 PNG, JPEG, GIF, WebP 格式',
      local: '所有图片均在浏览器本地处理',
      select: '选择文件',
    },
    history: {
      title: '历史记录',
      clear: '清空历史',
      grid: '网格',
    },
    action: {
      slice: '切割并下载',
      processing: '处理中...',
    },
    sidebar: {
      noFile: '上传图片以开始切割',
    },
  },
};
