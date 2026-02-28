import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, vi } from "vitest";
import { getMockAuth } from "./mocks/auth";

// JSDOM polyfills
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

window.scrollTo = vi.fn();

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error - provide browser API in tests
global.ResizeObserver = ResizeObserverMock;
// @ts-expect-error - provide browser API in tests
global.IntersectionObserver = IntersectionObserverMock;

afterEach(() => {
  cleanup();
});

// Simplify layouts in tests
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

// Stub heavy phone number components
vi.mock("@/components/phone-numbers/TaskCalendar", () => ({
  TaskCalendar: () => <div data-testid="task-calendar" />,
}));
vi.mock("@/components/phone-numbers/TaskList", () => ({
  TaskList: () => <div data-testid="task-list" />,
}));

// Mock auth + permissions
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => getMockAuth(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    permissions: [],
    loading: false,
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
    hasCategoryAccess: () => true,
    canAccessPage: () => true,
    refetchPermissions: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

// Generic query/mutation mocks
const EMPTY_ARRAY: any[] = [];
const EMPTY_OBJECT: Record<string, unknown> = {};

const queryHook = <T,>(data: T, overrides: Record<string, unknown> = {}) => ({
  data,
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
  ...overrides,
});

const mutationHook = (overrides: Record<string, unknown> = {}) => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isLoading: false,
  reset: vi.fn(),
  ...overrides,
});

vi.mock("@/hooks/queries/useClients", () => ({
  useClients: () => queryHook(EMPTY_ARRAY),
  useClient: () => queryHook(null),
  useClientWithDeposits: () => queryHook(null),
  useClientFullDetails: () => queryHook(null),
  useClientStats: () => queryHook({ total: 0, active: 0, late: 0, suspended: 0, inactive: 0 }),
  useClientsWithDeposits: () => queryHook(EMPTY_ARRAY),
  useClientsByEmployee: () => queryHook(EMPTY_ARRAY),
  useCreateClient: () => mutationHook(),
  useCreateClientWithDeposit: () => mutationHook(),
  useUpdateClient: () => mutationHook(),
  useDeleteClient: () => mutationHook(),
}));

vi.mock("@/hooks/queries/useDashboard", () => ({
  useDashboardStats: () =>
    queryHook({
      totalEmployees: 0,
      employeesChange: 0,
      totalClients: 0,
      clientsChange: 0,
      totalInvestments: 0,
      investmentsChange: 0,
      monthlyCommissions: 0,
      lateClients: 0,
    }),
  useMonthlyPerformance: () =>
    queryHook({ newClients: 0, newInvestments: 0, profitsPaid: 0, withdrawals: 0 }),
  useTopEmployees: () => queryHook(EMPTY_ARRAY),
  useRecentClients: () => queryHook(EMPTY_ARRAY),
  useUpcomingWithdrawals: () => queryHook(EMPTY_ARRAY),
}));

vi.mock("@/hooks/queries/useCommissions", () => ({
  useCommissions: () => queryHook(EMPTY_ARRAY),
  useCommission: () => queryHook(null),
  useEmployeeCommissions: () => queryHook(EMPTY_ARRAY),
  usePeriodCommissions: () => queryHook(EMPTY_ARRAY),
  useCommissionStats: () => queryHook({ total: 0, pending: 0, approved: 0, paid: 0 }),
  useCreateCommission: () => mutationHook(),
  useUpdateCommission: () => mutationHook(),
  useApproveCommission: () => mutationHook(),
  useMarkCommissionAsPaid: () => mutationHook(),
  useDeleteCommission: () => mutationHook(),
  useCalculateCommission: () => mutationHook(),
}));

vi.mock("@/hooks/queries/useWithdrawals", () => ({
  useWithdrawals: () => queryHook(EMPTY_ARRAY),
  useWithdrawalsWithClients: () => queryHook(EMPTY_ARRAY),
  useWithdrawal: () => queryHook(null),
  useUpcomingWithdrawals: () => queryHook(EMPTY_ARRAY),
  useOverdueWithdrawals: () => queryHook(EMPTY_ARRAY),
  useWithdrawalsByDeposit: () => queryHook(EMPTY_ARRAY),
  useWithdrawalStats: () => queryHook({ total: 0, upcoming: 0, completed: 0, overdue: 0 }),
  useCreateWithdrawal: () => mutationHook(),
  useUpdateWithdrawal: () => mutationHook(),
  useCompleteWithdrawal: () => mutationHook(),
  useCancelWithdrawal: () => mutationHook(),
  useDeleteWithdrawal: () => mutationHook(),
}));

vi.mock("@/hooks/queries/useMeetings", () => ({
  useMeetings: () => queryHook(EMPTY_ARRAY),
  useMeeting: () => queryHook(null),
  useCreateMeeting: () => mutationHook(),
  useUpdateMeeting: () => mutationHook(),
  useDeleteMeeting: () => mutationHook(),
}));

vi.mock("@/hooks/queries/usePosters", () => ({
  usePosters: () => queryHook(EMPTY_ARRAY),
  usePoster: () => queryHook(null),
  useCreatePoster: () => mutationHook(),
  useDeletePoster: () => mutationHook(),
}));

vi.mock("@/hooks/queries/useMessages", () => ({
  useMessages: () => queryHook(EMPTY_ARRAY),
  useConversation: () => queryHook(EMPTY_ARRAY),
  useGroupMessages: () => queryHook(EMPTY_ARRAY),
  useDirectMessages: () => queryHook(EMPTY_ARRAY),
  useMessage: () => queryHook(null),
  useUnreadCount: () => queryHook(0),
  useSendMessage: () => mutationHook(),
  useUpdateMessage: () => mutationHook(),
  useMarkMessageAsRead: () => mutationHook(),
  useDeleteMessage: () => mutationHook(),
  useRealtimeMessages: () => queryHook(EMPTY_ARRAY),
}));

vi.mock("@/hooks/queries/useProfiles", () => ({
  useProfiles: () => queryHook(EMPTY_ARRAY),
  useEmployees: () => queryHook(EMPTY_ARRAY),
  useEmployeesByRole: () => queryHook(EMPTY_ARRAY),
  useProfile: () => queryHook(null),
  useProfileStats: () => queryHook({ total: 0, active: 0, inactive: 0, byDepartment: {} }),
  useUpdateProfile: () => mutationHook(),
}));

vi.mock("@/hooks/queries/useDocuments", () => ({
  useDocuments: () => queryHook(EMPTY_ARRAY),
  useDocument: () => queryHook(null),
  useCreateDocument: () => mutationHook(),
  useUpdateDocument: () => mutationHook(),
  useDeleteDocument: () => mutationHook(),
  useVerifyDocument: () => mutationHook(),
}));

vi.mock("@/hooks/queries/useAttendance", () => ({
  useAttendance: () => queryHook(EMPTY_ARRAY),
  useAttendanceRecord: () => queryHook(null),
  useCreateAttendance: () => mutationHook(),
  useUpdateAttendance: () => mutationHook(),
  useDeleteAttendance: () => mutationHook(),
  useCheckIn: () => mutationHook(),
  useCheckOut: () => mutationHook(),
}));

vi.mock("@/hooks/queries/useLeaves", () => ({
  useLeaves: () => queryHook(EMPTY_ARRAY),
  useLeave: () => queryHook(null),
  useCreateLeave: () => mutationHook(),
  useUpdateLeave: () => mutationHook(),
  useDeleteLeave: () => mutationHook(),
  useApproveLeave: () => mutationHook(),
  useRejectLeave: () => mutationHook(),
}));

vi.mock("@/hooks/queries/usePayroll", () => ({
  usePayroll: () => queryHook(EMPTY_ARRAY),
  usePayrollRecord: () => queryHook(null),
  useCreatePayroll: () => mutationHook(),
  useUpdatePayroll: () => mutationHook(),
  useDeletePayroll: () => mutationHook(),
  useApprovePayroll: () => mutationHook(),
  useMarkPayrollAsPaid: () => mutationHook(),
}));

vi.mock("@/hooks/queries/usePenalties", () => ({
  usePenalties: () => queryHook(EMPTY_ARRAY),
  usePenalty: () => queryHook(null),
  useCreatePenalty: () => mutationHook(),
  useUpdatePenalty: () => mutationHook(),
  useDeletePenalty: () => mutationHook(),
  useDeactivatePenalty: () => mutationHook(),
}));

vi.mock("@/hooks/queries/useWorkSchedules", () => ({
  useWorkSchedules: () => queryHook(EMPTY_ARRAY),
  useEmployeeWorkSchedule: () => queryHook(null),
  useUpsertWorkSchedule: () => mutationHook(),
  useCreateDefaultSchedule: () => mutationHook(),
  useUpdateWorkSchedule: () => mutationHook(),
  useDeleteWorkSchedule: () => mutationHook(),
}));

vi.mock("@/hooks/queries/useTargets", () => ({
  useTargets: () => queryHook(EMPTY_ARRAY),
  useTarget: () => queryHook(null),
  useEmployeeTargets: () => queryHook(EMPTY_ARRAY),
  useCurrentTargets: () => queryHook(EMPTY_ARRAY),
  useMonthTargets: () => queryHook(EMPTY_ARRAY),
  useTargetStats: () => queryHook({ total: 0, achieved: 0, pending: 0 }),
  useTopPerformers: () => queryHook(EMPTY_ARRAY),
  useCreateTarget: () => mutationHook(),
  useUpdateTarget: () => mutationHook(),
  useUpdateTargetProgress: () => mutationHook(),
  useDeleteTarget: () => mutationHook(),
}));

vi.mock("@/hooks/queries/usePhoneNumbers", () => ({
  usePhoneNumberBatches: () => queryHook(EMPTY_ARRAY),
  usePhoneNumbersByBatch: () => queryHook(EMPTY_ARRAY),
  usePhoneNumbersByEmployee: () => queryHook(EMPTY_ARRAY),
  usePhoneNumberStats: () =>
    queryHook({ total: 0, pending: 0, called: 0, interested: 0, converted: 0 }),
  useEmployeeCalendarTasks: () => queryHook(EMPTY_ARRAY),
  useUpcomingTasks: () => queryHook(EMPTY_ARRAY),
  useTaskStats: () =>
    queryHook({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, completedToday: 0 }),
  useAssignPhoneNumbersRandom: () => mutationHook(),
  useAssignPhoneNumbersTargeted: () => mutationHook(),
  useUpdateTaskStatus: () => mutationHook(),
  useCreatePhoneNumberBatch: () => mutationHook(),
  useUpdatePhoneNumber: () => mutationHook(),
  useDeletePhoneNumberBatch: () => mutationHook(),
}));

vi.mock("@/hooks/queries/useAuditLogs", () => ({
  useAuditLogs: () => queryHook(EMPTY_ARRAY),
  useRecentAuditLogs: () => queryHook(EMPTY_ARRAY),
  useTableAuditLogs: () => queryHook(EMPTY_ARRAY),
}));

vi.mock("@/lib/env", () => ({
  env: {
    VITE_SUPABASE_URL: "https://example.supabase.co",
    VITE_SUPABASE_PUBLISHABLE_KEY: "test",
    VITE_ENV: "development",
    DEV: true,
    PROD: false,
    MODE: "test",
  },
  isDevelopment: true,
  isProduction: false,
  isStaging: false,
}));

// Supabase client mock
const createBuilder = (result: { data: any; error: any } = { data: [], error: null }) => {
  const builder: any = {
    _result: result,
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    is: () => builder,
    gte: () => builder,
    lte: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    single: () => {
      builder._result = { data: {}, error: null };
      return builder;
    },
    maybeSingle: () => {
      builder._result = { data: {}, error: null };
      return builder;
    },
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    upsert: () => builder,
  };
  builder.then = (resolve: any, reject: any) => Promise.resolve(builder._result).then(resolve, reject);
  return builder;
};

const channelMock = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  unsubscribe: vi.fn(),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => createBuilder()),
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "user-1" } } }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    channel: vi.fn(() => channelMock),
    removeChannel: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "" }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    },
  },
}));

// Mock recharts to avoid heavy layout work
vi.mock("recharts", () => {
  const MockComponent = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop === "__esModule") return true;
        return MockComponent;
      },
    }
  );
});
