import {
  majorityVerdict,
  ORIENTATION_VOTES_NEEDED,
  useOrientationStore,
} from '../useOrientationStore';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const resetStore = () => {
  useOrientationStore.setState({
    frontOrientation: null,
    source: null,
    votes: [],
    isHydrated: false,
  });
};

describe('majorityVerdict', () => {
  it('null sebelum suara cukup', () => {
    expect(majorityVerdict([])).toBeNull();
    expect(majorityVerdict(['cermin'])).toBeNull();
    expect(majorityVerdict(['cermin', 'cermin'])).toBeNull();
  });

  it('suara harus BULAT; suara terbelah tidak mengunci apa pun', () => {
    expect(majorityVerdict(['cermin', 'normal', 'cermin'])).toBeNull();
    expect(majorityVerdict(['normal', 'normal', 'cermin'])).toBeNull();
    expect(majorityVerdict(['normal', 'normal', 'normal'])).toBe('normal');
    expect(majorityVerdict(['cermin', 'cermin', 'cermin'])).toBe('cermin');
  });
});

describe('useOrientationStore', () => {
  beforeEach(resetStore);

  it('mengunci verdict otomatis setelah suara BULAT', () => {
    const { addVote } = useOrientationStore.getState();
    addVote('cermin');
    addVote('cermin');
    addVote('cermin');
    const state = useOrientationStore.getState();
    expect(state.frontOrientation).toBe('cermin');
    expect(state.source).toBe('auto');
    expect(state.votes).toHaveLength(ORIENTATION_VOTES_NEEDED);
  });

  it('suara terbelah TIDAK pernah mengunci verdict keliru', () => {
    const { addVote } = useOrientationStore.getState();
    addVote('cermin');
    addVote('normal');
    addVote('cermin');
    addVote('normal');
    expect(useOrientationStore.getState().frontOrientation).toBeNull();
  });

  it('belum ada verdict sebelum suara cukup', () => {
    useOrientationStore.getState().addVote('normal');
    useOrientationStore.getState().addVote('normal');
    expect(useOrientationStore.getState().frontOrientation).toBeNull();
  });

  it('suara baru tidak mengubah verdict yang sudah terkunci', () => {
    useOrientationStore.getState().setManual('normal');
    useOrientationStore.getState().addVote('cermin');
    useOrientationStore.getState().addVote('cermin');
    useOrientationStore.getState().addVote('cermin');
    const state = useOrientationStore.getState();
    expect(state.frontOrientation).toBe('normal');
    expect(state.source).toBe('manual');
  });

  it('kalibrasi manual menimpa auto dan mengosongkan suara', () => {
    useOrientationStore.getState().addVote('normal');
    useOrientationStore.getState().setManual('cermin');
    const state = useOrientationStore.getState();
    expect(state.frontOrientation).toBe('cermin');
    expect(state.source).toBe('manual');
    expect(state.votes).toEqual([]);
  });

  it('reset mengembalikan ke belum-diketahui', () => {
    useOrientationStore.getState().setManual('cermin');
    useOrientationStore.getState().reset();
    const state = useOrientationStore.getState();
    expect(state.frontOrientation).toBeNull();
    expect(state.source).toBeNull();
  });

  it('hydrate memuat simpanan dan menandai isHydrated', async () => {
    const secureStore = jest.requireMock('expo-secure-store') as {
      getItemAsync: jest.Mock;
    };
    secureStore.getItemAsync.mockResolvedValueOnce(
      JSON.stringify({ frontOrientation: 'cermin', source: 'manual', votes: [] })
    );
    await useOrientationStore.getState().hydrate();
    const state = useOrientationStore.getState();
    expect(state.frontOrientation).toBe('cermin');
    expect(state.source).toBe('manual');
    expect(state.isHydrated).toBe(true);
  });

  it('hydrate simpanan rusak tetap aman', async () => {
    const secureStore = jest.requireMock('expo-secure-store') as {
      getItemAsync: jest.Mock;
    };
    secureStore.getItemAsync.mockResolvedValueOnce('{rusak');
    await useOrientationStore.getState().hydrate();
    const state = useOrientationStore.getState();
    expect(state.frontOrientation).toBeNull();
    expect(state.isHydrated).toBe(true);
  });
});
