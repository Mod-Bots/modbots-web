"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type UiLanguage = "en" | "zh-CN";

const storageKey = "modbots.ui-language.v1";

const simplifiedChinese: Record<string, string> = {
  About: "关于",
  "About Mod Bots": "关于 Mod Bots",
  "A live chatroom where humans and chat bots talk, and mod bots learn to moderate from everything that happens.":
    "一个由用户和聊天机器人交流、管理机器人从所有互动中学习管理方式的实时聊天室。",
  Activity: "活动",
  "Activity period": "活动时间范围",
  "Address someone": "提及某人",
  Account: "账户",
  "Account health": "账户状态",
  "Add reaction": "添加回应",
  Appearance: "外观",
  "Application menu": "应用菜单",
  Back: "返回",
  Cancel: "取消",
  "Change picture": "更换头像",
  "Change profile picture": "更换头像",
  Chat: "聊天",
  "Chat bots": "聊天机器人",
  "Chat language": "聊天语言",
  "Chat settings": "聊天设置",
  "Auto Mode": "自动模式",
  "Check for Updates": "检查更新",
  Notifications: "通知",
  unread: "未读",
  "Clear all": "全部清除",
  "No notifications": "没有通知",
  "Dismiss notification": "关闭通知",
  "Connection interrupted": "连接中断",
  "Trying to reconnect...": "正在尝试重新连接...",
  "Connection restored": "连接已恢复",
  "Web update available": "有可用的网页更新",
  "Checking GitHub for web updates...": "正在检查 GitHub 上的网页更新...",
  "Mod Bots is up to date.": "Mod Bots 已是最新版本。",
  Version: "版本",
  "Downloading and installing the update...": "正在下载并安装更新...",
  "Mod Bots will reopen when the update is ready.":
    "更新准备好后，Mod Bots 将自动重新打开。",
  "The installed version could not be checked.": "无法检查已安装的版本。",
  "GitHub could not be checked for updates.": "无法在 GitHub 上检查更新。",
  "The update is taking longer than expected. Try again.":
    "更新所需时间超过预期，请重试。",
  "Try again": "重试",
  "Choose how messages appear and how you send them.":
    "选择消息的显示方式和发送方式。",
  "Choose how you send messages.": "选择消息的发送方式。",
  "Choose how messages are translated.": "选择消息的翻译方式。",
  "Choose the language used by the interface.": "选择界面使用的语言。",
  Close: "关闭",
  "Close menu": "关闭菜单",
  "Close participants": "关闭参与者列表",
  "Close room information": "关闭房间信息",
  "Close settings": "关闭设置",
  "Close side panel": "关闭侧边栏",
  Connected: "已连接",
  Connecting: "正在连接",
  "Everyone here": "这里的所有人",
  Copy: "复制",
  Cut: "剪切",
  Custom: "自定义",
  "Dark Mode": "深色模式",
  Documentation: "文档",
  Edit: "编辑",
  English: "English",
  File: "文件",
  "Find in Chat": "在聊天中查找",
  "Getting Started": "入门指南",
  Help: "帮助",
  Humans: "用户",
  "Identity created": "身份创建时间",
  Idle: "空闲",
  "Interface language": "界面语言",
  Links: "链接",
  "Light Mode": "浅色模式",
  "Log out": "退出登录",
  Language: "语言",
  "Language settings": "语言设置",
  Location: "位置",
  "Manage your account and chat settings.": "管理你的账户和聊天设置。",
  "Manage your Mod Bots settings.": "管理你的 Mod Bots 设置。",
  Fullscreen: "全屏",
  Maximize: "最大化",
  "Member since": "加入时间",
  Menu: "菜单",
  Messages: "消息",
  "Message the room": "向房间发送消息",
  Minimize: "最小化",
  "Mod bots": "管理机器人",
  Moderation: "管理",
  "Move settings window": "移动设置窗口",
  "Resize settings window": "调整设置窗口大小",
  "No recent mod bot action is attached to this account.":
    "此账户最近没有管理机器人的操作记录。",
  "Open application menu": "打开应用菜单",
  "Open full account page": "打开完整账户页面",
  Participants: "参与者",
  "Preparing session...": "正在准备会话...",
  "Preparing your session...": "正在准备你的会话...",
  Paste: "粘贴",
  Preset: "预设",
  Print: "打印",
  Profile: "个人资料",
  "Profile picture": "头像",
  "Profile pictures are served through UPPS.": "头像由 UPPS 提供。",
  Pronouns: "称谓",
  Redo: "重做",
  "Refresh the Chatroom": "刷新聊天室",
  "Release Notes": "发行说明",
  "Remove picture": "移除头像",
  "Report a Problem": "报告问题",
  "Submitting this form creates a public GitHub issue.":
    "提交此表单会创建一个公开的 GitHub 议题。",
  "Issue title": "议题标题",
  "Briefly describe the problem": "简要描述问题",
  Description: "详细说明",
  "Explain what happened and what you expected to happen.":
    "说明发生了什么，以及你原本期望发生什么。",
  "Submitting...": "正在提交...",
  Submit: "提交",
  "The issue could not be created. Please try again.": "无法创建议题，请重试。",
  "Problem reporting is not configured.": "问题报告功能尚未配置。",
  "Enter an issue title and description.": "请输入议题标题和详细说明。",
  "GitHub could not create the issue. Please try again.":
    "GitHub 无法创建议题，请重试。",
  "The GitHub issue was created successfully.": "GitHub 议题已成功创建。",
  "View issue": "查看议题",
  Done: "完成",
  "Request a Feature": "建议新功能",
  "Feature title": "功能标题",
  "Briefly describe the feature": "简要描述该功能",
  "Explain the feature and how it would improve Mod Bots.":
    "说明该功能，以及它将如何改进 Mod Bots。",
  "Submit feature request": "提交功能请求",
  "The feature request could not be created. Please try again.":
    "无法创建功能请求，请重试。",
  "Feature requests are not configured.": "功能请求尚未配置。",
  "Enter a feature title and description.": "请输入功能标题和详细说明。",
  "GitHub could not create the feature request. Please try again.":
    "GitHub 无法创建功能请求，请重试。",
  "The GitHub feature request was created successfully.":
    "GitHub 功能请求已成功创建。",
  "Reset Zoom": "重置缩放",
  Restore: "还原",
  "Restoring your session...": "正在恢复你的会话...",
  Room: "房间",
  "Room information": "房间信息",
  Rules: "规则",
  "Save profile": "保存个人资料",
  "Saving picture...": "正在保存头像...",
  "Saving...": "正在保存...",
  "Search the chat": "搜索聊天内容",
  "Select All": "全选",
  Send: "发送",
  "Send with Enter": "按 Enter 发送",
  Settings: "设置",
  "System Mode": "系统模式",
  "Starting Mod Bots...": "正在启动 Mod Bots...",
  "Shift + Enter for a new line": "按 Shift + Enter 换行",
  "Show menus, buttons, and settings in English.":
    "以英文显示菜单、按钮和设置。",
  "Show menus, buttons, and settings in Simplified Chinese.":
    "以简体中文显示菜单、按钮和设置。",
  "Translate messages": "翻译消息",
  "Translate messages into": "将消息翻译为",
  "Take a Screenshot": "截取屏幕截图",
  "User Manual": "用户手册",
  Theme: "主题",
  Today: "今天",
  Tools: "工具",
  "Translating...": "正在翻译...",
  "Not joined": "尚未加入",
  "Not set": "未设置",
  Offline: "离线",
  Online: "在线",
  "Open to guests, anonymous or registered": "访客、匿名用户和注册用户均可加入",
  "Text, images, audio, video, and files": "支持文字、图片、音频、视频和文件",
  You: "你",
  Undo: "撤销",
  View: "视图",
  "View original": "查看原文",
  "View translation": "查看译文",
  Window: "窗口",
  "Write and read messages in English.": "以英文撰写和阅读消息。",
  "Write and read messages in Simplified Chinese. Translation happens automatically.":
    "以简体中文撰写和阅读消息，翻译会自动完成。",
  Zoom: "缩放",
  "Zoom In": "放大",
  "Zoom Out": "缩小",
  "Add a file, image, audio, or video": "添加文件、图片、音频或视频",
  "Add an audio recording": "添加录音",
  "Add an image": "添加图片",
  "Add image": "添加图片",
  "Add files or media": "添加文件或媒体",
  "Cancel reply": "取消回复",
  "Clear search": "清除搜索",
  "Close search": "关闭搜索",
  "Dismiss attachment error": "关闭附件错误提示",
  "Dismiss muted notice": "关闭静音提示",
  "Dismiss translation error": "关闭翻译错误提示",
  "Moderation has muted you in this room": "你已在此房间中被静音",
  "More actions": "更多操作",
  "More message actions": "更多消息操作",
  Muted: "已静音",
  "Reactions are not connected yet": "回应功能尚未启用",
  "Record voice message": "录制语音消息",
  "Remove attachment": "移除附件",
  Reply: "回复",
  "Reply to message": "回复消息",
  "Sending...": "正在发送...",
  "Show participants": "显示参与者",
  "Show room information": "显示房间信息",
  "Your profile": "你的个人资料",
  Active: "活跃",
  All: "全部",
  "None in this period.": "此时间段内没有记录。",
  "chat bot": "聊天机器人",
  "mod bot": "管理机器人",
};

interface UiLanguageContextValue {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
  t: (text: string) => string;
}

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null);

const readStoredLanguage = (): UiLanguage => {
  try {
    return window.localStorage.getItem(storageKey) === "zh-CN" ? "zh-CN" : "en";
  } catch {
    return "en";
  }
};

export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>("en");

  useEffect(() => {
    const storedLanguage = readStoredLanguage();
    setLanguageState(storedLanguage);
    document.documentElement.lang = storedLanguage;
  }, []);

  const setLanguage = useCallback((nextLanguage: UiLanguage) => {
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;

    try {
      window.localStorage.setItem(storageKey, nextLanguage);
    } catch {
      // The language still applies for the current visit when storage is blocked.
    }
  }, []);

  const t = useCallback(
    (text: string): string =>
      language === "zh-CN" ? (simplifiedChinese[text] ?? text) : text,
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <UiLanguageContext.Provider value={value}>
      {children}
    </UiLanguageContext.Provider>
  );
}

export function useUiLanguage(): UiLanguageContextValue {
  const context = useContext(UiLanguageContext);

  if (context === null) {
    throw new Error("useUiLanguage must be used within UiLanguageProvider");
  }

  return context;
}
