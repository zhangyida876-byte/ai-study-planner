import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppInfo } from '@lark-apaas/client-toolkit/hooks/useAppInfo';
import { useCurrentUserProfile } from '@lark-apaas/client-toolkit/hooks/useCurrentUserProfile';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Home,
  Stethoscope,
  GraduationCap,
  BookOpen,
  CalendarDays,
  MessageCircleMore,
  LogOut,
  LogIn,
  Pen,
  School,
} from 'lucide-react';
import { Image } from '@/components/ui/image';
import {
  STAGE_LIST,
  STAGE_CONFIGS,
  parseStageSlugFromPathname,
  stagePath,
  getFeatureLabel,
  type FeatureSlug,
  type StageSlug,
} from '@client/src/config/stages';

const GUEST_AVATAR = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/LMfspH/ljhwZthlaukjlkulzlp/miao/no-person.svg';

const FEATURE_ICONS: Record<FeatureSlug, React.FC<{ className?: string }>> = {
  diagnosis: Stethoscope,
  plan: GraduationCap,
  knowledge: BookOpen,
  'study-plan': CalendarDays,
  advice: MessageCircleMore,
};

function resolveFeatureFromPath(pathname: string, stage: StageSlug | null): FeatureSlug | null {
  if (!stage) return null;
  if (pathname.includes('/diagnosis')) return 'diagnosis';
  if (pathname.includes('/plan') && !pathname.includes('/study-plan')) return 'plan';
  if (pathname.includes('/knowledge')) return 'knowledge';
  if (pathname.includes('/study-plan')) return 'study-plan';
  if (pathname.includes('/advice')) return 'advice';
  return null;
}

const LayoutContent: React.FC = () => {
  const { pathname } = useLocation();
  const { appName } = useAppInfo();
  const userInfo = useCurrentUserProfile();

  const stageSlug = parseStageSlugFromPathname(pathname);
  const stageConfig = stageSlug ? STAGE_CONFIGS[stageSlug] : null;
  const featureSlug = resolveFeatureFromPath(pathname, stageSlug);
  const isStageHome = stageSlug != null && pathname.replace(/\/+$/, '').endsWith(`/${stageSlug}`);

  const handleLogout = async () => {
    const { getDataloom } = await import('@lark-apaas/client-toolkit/dataloom');
    const dataloom = await getDataloom();
    const result = await dataloom.service.session.signOut();
    if (result.error) {
      logger.error('退出登录失败:', result.error.message);
      return;
    }
    window.location.reload();
  };

  const handleLogin = async () => {
    const { getDataloom } = await import('@lark-apaas/client-toolkit/dataloom');
    const dataloom = await getDataloom();
    dataloom.service.session.redirectToLogin();
  };

  const isLoggedIn = !!userInfo?.user_id;
  const displayName = userInfo?.name || '游客';
  const avatarUrl = userInfo?.avatar || GUEST_AVATAR;

  const breadcrumbTitle = stageConfig
    ? featureSlug
      ? `${stageConfig.label} · ${getFeatureLabel(stageSlug!, featureSlug)}`
      : `${stageConfig.label}学段`
    : '选择学段';

  return (
    <>
      <Sidebar collapsible="icon" className="border-r-[3px] border-ink">
        <SidebarHeader className="border-b-2 border-dashed border-ink/20">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/">
                  <div className="flex size-8 items-center justify-center rounded-full bg-ink text-primary-foreground">
                    <Pen className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-marker font-bold text-lg">
                      {appName || '学情顾问'}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="首页">
                    <Link to="/">
                      <Home className="size-4" />
                      <span className="font-hand">选择学段</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="font-marker text-xs">学段入口</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {STAGE_LIST.map((stage) => (
                  <SidebarMenuItem key={stage.slug}>
                    <SidebarMenuButton
                      asChild
                      isActive={stageSlug === stage.slug && isStageHome}
                      tooltip={stage.label}
                    >
                      <Link to={stagePath(stage.slug)}>
                        <School className="size-4" />
                        <span className="font-hand">{stage.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {stageConfig && (
            <SidebarGroup>
              <SidebarGroupLabel className="font-marker text-xs">
                {stageConfig.label} · 功能
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {stageConfig.features.map((feature) => {
                    const Icon = FEATURE_ICONS[feature.slug];
                    const href = stagePath(stageSlug!, feature.slug);
                    return (
                      <SidebarMenuItem key={feature.slug}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === href || pathname.startsWith(`${href}/`)}
                          tooltip={feature.label}
                        >
                          <Link to={href}>
                            <Icon className="size-4" />
                            <span className="font-hand">{feature.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t-2 border-dashed border-ink/20">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      className="size-8 rounded-full border-2 border-ink"
                      width={32}
                      height={32}
                    />
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-hand font-bold">{displayName}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="end"
                  className="w-48 border-[3px] border-ink shadow-hard font-hand"
                >
                  {isLoggedIn ? (
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 size-4" />
                      退出登录
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleLogin}>
                      <LogIn className="mr-2 size-4" />
                      登录
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 flex flex-col overflow-hidden bg-paper-dots">
        <header className="flex h-14 items-center gap-2 px-6 border-b-2 border-dashed border-ink/20 bg-card/80 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb className="self-center">
            <BreadcrumbList>
              <BreadcrumbItem className="text-foreground font-marker font-bold text-lg">
                {breadcrumbTitle}
              </BreadcrumbItem>
              {stageConfig && featureSlug && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="font-hand text-sm text-muted-foreground">
                    {stageConfig.subtitle}
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </>
  );
};

const Layout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default Layout;
