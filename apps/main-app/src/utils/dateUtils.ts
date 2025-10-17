/**
 * 日期时间工具函数
 * 提供统一的时间格式化功能
 */

/**
 * 格式化时间戳为可读的日期时间字符串
 * @param timestamp - 时间戳（毫秒）
 * @param options - 格式化选项
 * @returns 格式化后的日期时间字符串
 */
export function formatTimestamp(
  timestamp: number,
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    hour12?: boolean;
  } = {},
): string {
  const { includeTime = true, includeSeconds = true, hour12 = false } = options;

  const date = new Date(timestamp);

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12,
  };

  if (includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';

    if (includeSeconds) {
      formatOptions.second = '2-digit';
    }
  }

  return date.toLocaleString('zh-CN', formatOptions);
}

/**
 * 格式化日期字符串为可读的日期时间字符串
 * @param dateString - 日期字符串
 * @param options - 格式化选项
 * @returns 格式化后的日期时间字符串
 */
export function formatDateString(
  dateString: string,
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    hour12?: boolean;
  } = {},
): string {
  return formatTimestamp(new Date(dateString).getTime(), options);
}

/**
 * 获取当前时间的格式化字符串
 * @param options - 格式化选项
 * @returns 当前时间的格式化字符串
 */
export function getCurrentTimeString(
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    hour12?: boolean;
  } = {},
): string {
  return formatTimestamp(Date.now(), options);
}

/**
 * 获取相对时间描述（如：2分钟前、1小时前）
 * @param timestamp - 时间戳（毫秒）
 * @returns 相对时间描述
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}分钟前`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}小时前`;
  } else {
    const days = Math.floor(diff / day);
    return `${days}天前`;
  }
}
