import { useEffectValue } from "@hooks/helpers/useEffectValue";
import {
  useEventListener,
  useEventListenerValue,
} from "@hooks/helpers/useEventListener";
import { useForwardedRef } from "@hooks/helpers/useForwadedRef";
import {
  ComponentProps,
  ReactNode,
  RefObject,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export const AudioPlayer = () => <></>;

const Context = createContext<{ ref: RefObject<HTMLAudioElement> }>({
  ref: null as any,
});

type AudioPlayerRootProps = {
  children: ReactNode;
  defaultVolume?: number;
  defaultMuted?: boolean;
} & Omit<ComponentProps<"audio">, "children">;

AudioPlayer.Root = forwardRef<HTMLAudioElement, AudioPlayerRootProps>(
  ({ children, defaultVolume, defaultMuted, ...props }, forwardRef) => {
    const alternativeRef = useRef<HTMLAudioElement>(null);
    const [ref, setRef] = useState<RefObject<HTMLAudioElement>>({
      current: null,
    });

    useEffect(() => {
      if (forwardRef === null) setRef(alternativeRef);
      else {
        const forwadedRef = useForwardedRef(forwardRef);
        if (forwadedRef.current) setRef(forwadedRef);
      }
    }, [forwardRef]);

    useEffect(() => {
      if (ref.current) {
        if (defaultVolume !== undefined) {
          ref.current.volume = defaultVolume;
          const event = new Event("volumechange", { bubbles: true });
          ref.current.dispatchEvent(event);
        }

        if (defaultMuted !== undefined) {
          ref.current.muted = defaultMuted;
          const event = new Event("volumechange", { bubbles: true });
          ref.current.dispatchEvent(event);
        }
      }
    }, [ref]);

    return (
      <Context.Provider value={{ ref }}>
        {children}
        <audio ref={forwardRef ?? alternativeRef} {...props} />
      </Context.Provider>
    );
  }
);

type ButtonProps = {
  onClick: (
    ref: HTMLAudioElement,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
} & Omit<ComponentProps<"button">, "onClick">;
AudioPlayer.Button = ({ children, onClick, ...props }: ButtonProps) => {
  const { ref } = useContext(Context);
  return (
    <button
      onClick={(e) => {
        if (!ref || !ref.current)
          throw new Error("No audio element in the context");
        onClick(ref.current, e);
      }}
      {...props}
    >
      {children}
    </button>
  );
};

type PlayProps = {} & Omit<ComponentProps<"button">, "onClick">;
AudioPlayer.Play = ({ children, ...props }: PlayProps) => {
  const { ref } = useContext(Context);
  const [isPlaying, setIsPlaying] = useState(false);

  useEventListener(ref, "playing", () => {
    setIsPlaying(true);
  });

  useEventListener(ref, "pause", () => {
    setIsPlaying(false);
  });

  return (
    <AudioPlayer.Button
      onClick={(audio) => {
        audio.play();
      }}
      data-play={isPlaying}
      data-pause={!isPlaying}
      {...props}
    >
      {children}
    </AudioPlayer.Button>
  );
};

type PauseProps = {} & Omit<ComponentProps<"button">, "onClick">;
AudioPlayer.Pause = ({ children, ...props }: PauseProps) => {
  const { ref } = useContext(Context);
  const [isPaused, setIsPaused] = useState(true);
  useEventListener(ref, "playing", () => {
    setIsPaused(false);
  });

  useEventListener(ref, "pause", () => {
    setIsPaused(true);
  });

  return (
    <AudioPlayer.Button
      onClick={(audio) => {
        audio.pause();
      }}
      data-play={!isPaused}
      data-pause={isPaused}
      {...props}
    >
      {children}
    </AudioPlayer.Button>
  );
};

type PlayingProps = {
  children: (state: { playing: boolean }) => ReactNode;
};
AudioPlayer.Playing = ({ children }: PlayingProps) => {
  const { ref } = useContext(Context);
  const [isPlaying, setIsPlaying] = useState(false);

  useEventListener(ref, "playing", () => {
    setIsPlaying(true);
  });

  useEventListener(ref, "pause", () => {
    setIsPlaying(false);
  });

  return <>{children({ playing: isPlaying })}</>;
};

export type VolumeData = {
  volume: number;
  muted: boolean;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
};
type VolumeProps = {
  children: (volume: VolumeData) => ReactNode;
};
AudioPlayer.Volume = ({ children }: VolumeProps) => {
  const { ref } = useContext(Context);

  const volume = useEffectValue(
    () => {
      if (ref.current) return ref.current.volume;
      return 0;
    },
    [ref],
    0
  );

  const volumeChanged = useEventListenerValue(
    ref,
    "volumechange",
    (event) => (event.target as HTMLAudioElement).volume,
    0
  );

  const muted = useEffectValue(
    () => {
      if (ref.current) return ref.current.muted;
      return false;
    },
    [ref],
    false
  );

  const mutedChanged = useEventListenerValue(
    ref,
    "volumechange",
    (event) => (event.target as HTMLAudioElement).muted,
    false
  );

  const setVolume = (volume: number) => {
    if (!ref || !ref.current)
      throw new Error("No audio element in the context");
    ref.current.volume = volume;
  };

  const setMuted = (muted: boolean) => {
    if (!ref || !ref.current)
      throw new Error("No audio element in the context");
    ref.current.muted = muted;
  };

  return (
    <>
      {children({
        volume: volumeChanged ?? volume,
        setVolume: setVolume,
        setMuted: setMuted,
        muted: mutedChanged ?? muted,
      })}
    </>
  );
};

type Time = {
  time: number;
  duration: number;
};
type TimeProps = {
  children: (time: Time) => ReactNode;
};
AudioPlayer.Time = ({ children }: TimeProps) => {
  const { ref } = useContext(Context);

  const time = useEventListenerValue(
    ref,
    "timeupdate",
    (event) => (event.target as HTMLAudioElement).currentTime,
    0
  );

  const duration = useEffectValue(
    () => {
      if (ref.current) return ref.current.duration || 0;
      return 0;
    },
    [ref],
    0
  );

  const durationChanged = useEventListenerValue(
    ref,
    "durationchange",
    (event) => (event.target as HTMLAudioElement).duration || 0,
    0
  );

  return <>{children({ time, duration: durationChanged || duration })}</>;
};

export function useAudioPlayer() {
  const context = useContext(Context);

  if (context === undefined)
    throw new Error(`useAudioPlayer must be used within a AudioPlayer.Root.`);

  return context;
}

export function useIsPlaying<TRef extends RefObject<HTMLAudioElement>>(
  ref: TRef
) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEventListener(ref, "playing", () => {
    setIsPlaying(true);
  });

  useEventListener(ref, "pause", () => {
    setIsPlaying(false);
  });

  useEventListener(ref, "ended", () => {
    setIsPlaying(false);
  });

  return isPlaying;
}
