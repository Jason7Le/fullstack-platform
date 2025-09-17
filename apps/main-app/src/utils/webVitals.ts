import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

/**
 * Web Vitals 指标接口定义
 *
 * 单位说明：
 * - TTFB, FCP, LCP, INP: 毫秒 (ms)
 * - CLS: 无单位 (0-1 之间的数值)
 */
interface WebVitalMetric {
  /** 指标名称 (TTFB, FCP, LCP, INP, CLS) */
  name: string;
  /** 指标数值 - TTFB/FCP/LCP/INP: 毫秒(ms), CLS: 无单位(0-1) */
  value: number;
  /** 指标评级 (good, needs-improvement, poor) */
  rating: string;
  /** 指标变化量 - 单位同 value */
  delta: number;
  /** 指标唯一标识符 */
  id: string;
  /** 导航类型 (navigate, reload, back-forward, prerender) */
  navigationType: string;
}

/**
 * 全局 gtag 类型声明
 * 用于 Google Analytics 集成
 */
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

/**
 * 存储待提交的指标数据
 * 用于延迟提交机制，主要存储 CLS 和 LCP 指标
 */
const pendingMetrics: WebVitalMetric[] = [];

/**
 * 已提交的指标ID集合
 * 用于防止重复提交
 */
const submittedMetricIds = new Set<string>();

/**
 * 本地存储的键名
 * 用于持久化待提交的指标数据
 */
const STORAGE_KEY = 'web-vitals-pending-metrics';

/**
 * 检查指标是否已经提交过
 *
 * @param metricId - 指标的唯一标识符
 * @returns 如果指标已提交过则返回 true，否则返回 false
 */
function isMetricAlreadySubmitted(metricId: string): boolean {
  return submittedMetricIds.has(metricId);
}

/**
 * 标记指标为已提交
 * 防止同一指标被重复提交
 *
 * @param metricId - 指标的唯一标识符
 */
function markMetricAsSubmitted(metricId: string): void {
  submittedMetricIds.add(metricId);
}

/**
 * 从本地存储加载待提交的指标
 * 在页面初始化时调用，恢复之前未提交的指标数据
 * 会自动过滤掉已经提交过的指标，避免重复提交
 */
function loadPendingMetricsFromStorage(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const metrics = JSON.parse(stored);
      if (Array.isArray(metrics)) {
        // 过滤掉已经提交过的指标
        const newMetrics = metrics.filter((metric) => !isMetricAlreadySubmitted(metric.id));
        if (newMetrics.length > 0) {
          pendingMetrics.push(...newMetrics);
          console.log(`[Web Vitals] 从本地存储加载了 ${newMetrics.length} 个待提交指标`);
        }
      }
    }
  } catch (error) {
    console.warn('[Web Vitals] 从本地存储加载指标失败:', error);
  }
}

/**
 * 保存待提交的指标到本地存储
 * 用于持久化 CLS 和 LCP 等延迟提交的指标
 * 如果待提交列表为空，则清除本地存储
 */
function savePendingMetricsToStorage(): void {
  try {
    if (pendingMetrics.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingMetrics));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[Web Vitals] 保存指标到本地存储失败:', error);
  }
}

/**
 * 发送指标到分析服务
 * 支持批量提交多个指标，提高性能和可靠性
 * 同时支持 Google Analytics 和自定义 API 两种发送方式
 *
 * @param metrics - 要提交的指标数组
 */
async function sendMetricsToAnalytics(metrics: WebVitalMetric[]): Promise<void> {
  if (metrics.length === 0) return;

  console.log(`[Web Vitals] 批量提交 ${metrics.length} 个指标`);

  // 发送到 Google Analytics（如果可用）
  if (typeof window !== 'undefined' && window.gtag) {
    metrics.forEach((metric) => {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        // CLS 值需要乘以 1000 转换为整数
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
      });
    });
  }

  // 发送到自定义 API
  const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  if (analyticsEndpoint) {
    try {
      const batchData = {
        metrics: metrics.map((metric) => ({
          name: metric.name,
          value: metric.value,
          unit: metric.name === 'CLS' ? 'unitless' : 'ms',
          id: metric.id,
          delta: metric.delta,
          navigationType: metric.navigationType,
          rating: metric.rating,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        })),
        batchInfo: {
          totalCount: metrics.length,
          submittedAt: Date.now(),
          pageUrl: window.location.href,
        },
      };

      const response = await fetch(`${analyticsEndpoint}/web-vitals/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData),
      });

      if (response.ok) {
        console.log(`[Web Vitals] 批量提交成功，共 ${metrics.length} 个指标`);
      } else {
        console.warn(`[Web Vitals] 批量提交失败:`, response.status);
      }
    } catch (error) {
      console.error(`[Web Vitals] 批量提交出错:`, error);
    }
  }
}

/**
 * 处理 Web Vitals 指标
 * 核心处理函数，负责指标的去重、存储和提交逻辑
 *
 * 处理流程：
 * 1. 检查指标是否已提交过，避免重复提交
 * 2. 根据指标类型决定提交时机：
 *    - CLS/LCP: 延迟提交，存储到本地
 *    - TTFB/FCP/INP: 立即提交，同时提交所有待提交指标
 * 3. 标记已提交的指标，防止重复处理
 *
 * @param metric - Web Vitals 指标对象
 * @param metric.name - 指标名称 (TTFB, FCP, LCP, INP, CLS)
 * @param metric.value - 指标数值 (TTFB/FCP/LCP/INP: 毫秒ms, CLS: 无单位0-1)
 * @param metric.rating - 指标评级 (good, needs-improvement, poor)
 * @param metric.delta - 指标变化量 (单位同 value)
 * @param metric.id - 指标唯一标识符
 * @param metric.navigationType - 导航类型 (navigate, reload, back-forward, prerender)
 */
function handleMetric(metric: WebVitalMetric): void {
  // 检查是否已经提交过
  if (isMetricAlreadySubmitted(metric.id)) {
    console.log(`[Web Vitals] ${metric.name} 指标已提交过，跳过重复提交`);
    return;
  }

  console.log(`[Web Vitals] 收到指标: ${metric.name}`, {
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
  });

  // 判断是否需要延迟提交
  const shouldDelaySubmission = metric.name === 'CLS' || metric.name === 'LCP';

  if (shouldDelaySubmission) {
    // 延迟提交的指标：CLS 和 LCP
    // 这些指标需要等待页面稳定后才能准确收集
    console.log(`[Web Vitals] ${metric.name} 指标延迟提交，存储到本地`);
    pendingMetrics.push(metric);
    savePendingMetricsToStorage();
  } else {
    // 立即提交的指标：TTFB, FCP, INP
    // 这些指标可以在页面加载过程中立即收集和提交
    // 同时提交所有待提交的指标（CLS, LCP）
    const allMetrics = [metric, ...pendingMetrics];
    sendMetricsToAnalytics(allMetrics);

    // 标记所有指标为已提交，防止重复提交
    allMetrics.forEach((m) => markMetricAsSubmitted(m.id));

    // 清空待提交列表
    pendingMetrics.length = 0;
    savePendingMetricsToStorage();
  }

  // 开发环境控制台输出
  if (import.meta.env.MODE === 'development') {
    console.log('Web Vital:', metric);
  }
}

/**
 * 检查当前页面是否应该被监控
 * 根据环境变量配置的监控页面列表判断当前页面是否需要监控
 *
 * 监控规则：
 * 1. 如果未启用监控且非生产环境，则不监控
 * 2. 如果未配置监控页面，则监控所有页面
 * 3. 如果配置了监控页面，则只监控指定页面
 *
 * 支持通配符匹配，例如：
 * - "/dashboard/*" 匹配所有以 /dashboard/ 开头的页面
 * - "/login" 精确匹配 /login 页面
 *
 * @returns 如果当前页面应该被监控则返回 true，否则返回 false
 */
function shouldMonitorCurrentPage(): boolean {
  const enabledPages = import.meta.env.VITE_WEB_VITALS_PAGES;
  const isEnabled = import.meta.env.VITE_WEB_VITALS_ENABLED === 'true';
  const isProd = import.meta.env.PROD;

  if (!isEnabled && !isProd) return false;
  if (!enabledPages) return true;

  const pagesToMonitor = enabledPages.split(',').map((page: string) => page.trim());
  const currentPath = window.location.pathname;

  return pagesToMonitor.some((page: string) => {
    if (page.includes('*')) {
      const pattern = page.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentPath);
    }
    return currentPath === page;
  });
}

/**
 * 初始化 Web Vitals 监控
 * 主入口函数，负责设置和启动 Web Vitals 监控
 *
 * 初始化流程：
 * 1. 检查当前页面是否应该被监控
 * 2. 检查监控是否启用（生产环境或明确启用）
 * 3. 从本地存储加载待提交的指标
 * 4. 注册各种 Web Vitals 指标的监听器
 *
 * 指标收集时机说明：
 * - TTFB (Time to First Byte): 页面开始加载时，最早可用
 * - FCP (First Contentful Paint): 首次内容绘制，相对较早
 * - LCP (Largest Contentful Paint): 最大内容绘制，需要等待页面渲染完成
 * - INP (Interaction to Next Paint): 交互到下次绘制，需要用户交互
 * - CLS (Cumulative Layout Shift): 累积布局偏移，需要用户交互或页面变化
 *
 * @returns void
 */
export function initWebVitals(): void {
  console.log('[Web Vitals] 开始初始化监控...');

  // 检查是否应该监控当前页面
  if (!shouldMonitorCurrentPage()) {
    console.log('[Web Vitals] 当前页面不在监控范围内，跳过监控');
    return;
  }

  // 只在生产环境或明确启用时运行
  // 通过环境变量 VITE_WEB_VITALS_ENABLED=true 可以强制启用
  if (import.meta.env.PROD || import.meta.env.VITE_WEB_VITALS_ENABLED === 'true') {
    // 从本地存储加载待提交的指标
    loadPendingMetricsFromStorage();

    // 注册立即收集的指标监听器
    // TTFB, FCP, INP 可以在页面加载过程中立即收集
    onTTFB(handleMetric);
    onFCP(handleMetric);
    onINP(handleMetric);

    // 延迟注册需要等待页面稳定的指标
    // LCP, CLS 需要等待页面稳定后才能准确收集
    if (document.readyState === 'complete') {
      // 页面已经完全加载，立即注册
      onLCP(handleMetric);
      onCLS(handleMetric);
    } else {
      // 等待页面加载完成后再注册
      window.addEventListener('load', () => {
        // 延迟一点时间确保页面完全稳定
        setTimeout(() => {
          onLCP(handleMetric);
          onCLS(handleMetric);
        }, 1000);
      });
    }
  } else {
    console.log('[Web Vitals] 监控未启用（开发环境或未设置 VITE_WEB_VITALS_ENABLED）');
  }
}
