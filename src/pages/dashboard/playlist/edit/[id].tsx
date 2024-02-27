import { ModalRef } from "@components/elements/confirmation-modal";
import { ErrorMessages } from "@components/elements/error";
import { List } from "@components/elements/list";
import { GetLayoutThrough } from "@components/layout/layout";
import { PlaylistBanner } from "@components/player/playlist-banner";
import { TrackBanner } from "@components/player/track-banner";
import { TrackPlayer, usePlayer } from "@components/player/track-player";
import { AlbumInput, useMergeAlbum } from "@components/playlist/albums-picture";
import { editSchema, useEdit } from "@components/playlist/playlist-form";
import { RemoveModal } from "@components/playlist/remove-modal";
import { Track } from "@components/playlist/types";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { spotify } from "@hooks/api/useTrackApi";
import { useCountCallback } from "@hooks/helpers/useCountCallback";
import { useMap } from "@hooks/helpers/useMap";
import { useForm } from "@marienilba/react-zod-form";
import { api } from "@utils/api";
import { getQuery } from "@utils/next-router";
import { Noop } from "helpers/noop";
import type { NextPageWithLayout, NextPageWithTitle } from "next";
import { useRouter } from "next/router";
import { useRef } from "react";

const PlaylistEdit = () => {
  const { query } = useRouter();
  const id = getQuery(query.id);

  const {
    map: tracksMap,
    add: addTrack,
    remove: removeTrack,
    adds: addTracks,
    removes: removeTracks,
    reset: resetTracks,
  } = useMap<Track>();

  const { data } = spotify.getUserPlaylists();
  const { refetch: mutate, data: tracks } = spotify.getPlaylistTracks();

  const modal = useRef<ModalRef>(null);
  const currentRemoveTrack = useRef<Track>();

  const handleRemoveTrack = useCountCallback(
    { at: 15, reset: 60000 },
    removeTrack,
    (track) => {
      currentRemoveTrack.current = track;
      if (modal.current) modal.current.open();
    },
    [tracks]
  );

  const [mockAlbumsPicture, fetchMergeAlbum] = useMergeAlbum(tracksMap);

  const { load, play, toggle, currentTrack, playing } = usePlayer();
  const playTrack = async (track: Track) => {
    if (currentTrack && currentTrack.id === track.id) {
      await toggle();
    } else {
      load(track);
      await play();
    }
  };

  const { data: playlist } = api.playlist.get_playlist.useQuery(
    { id: id! },
    {
      enabled: id !== undefined,
      refetchOnWindowFocus: false,
      onSuccess(playlist) {
        addTracks(playlist.tracks);
      },
    }
  );

  const { submitPreventDefault, isSubmitting, isLoading, isSuccess } = useEdit({
    id,
    playlist,
    tracksMap,
    mockAlbum: mockAlbumsPicture,
    fetchMockAlbum: fetchMergeAlbum,
  });

  const f0rm = useForm(editSchema, submitPreventDefault);

  const [autoAnimateRef] = useAutoAnimate();

  return (
    <div className="scrollbar-hide flex flex-1 flex-row gap-2">
      <List.Root className="scrollbar-hide flex h-screen flex-1 flex-col gap-2 overflow-y-auto p-4 pb-24 pt-20">
        {data?.map((playlist) => (
          <List.Item
            className="outline-none focus:ring-1 focus:ring-white/20"
            key={playlist.id}
            onKeyUp={({ code }) =>
              code === "Enter" && mutate({ id: playlist.id })
            }
          >
            <PlaylistBanner
              playlist={playlist}
              onClick={(id) => mutate({ id })}
            />
          </List.Item>
        ))}
      </List.Root>
      <div className="scrollbar-hide relative flex h-screen flex-1 flex-col gap-2 overflow-y-auto px-2 pb-24 pt-0.5">
        {tracks && (
          <div className="sticky top-0 z-10 flex items-center justify-center gap-4 bg-black/10 py-2 pt-20 backdrop-blur-sm">
            {!(
              tracks.length && tracks.every((track) => tracksMap.has(track.id))
            ) && (
              <button
                onClick={() => addTracks(tracks)}
                className=" rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
              >
                Ajouter tout
              </button>
            )}
            {tracks.some((track) => tracksMap.has(track.id)) && (
              <button
                onClick={() => removeTracks(tracks)}
                className="rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
              >
                Retirer tout
              </button>
            )}
          </div>
        )}
        <List.Root className="flex flex-col gap-2 p-4">
          {tracks?.map((track) => (
            <List.Item
              className="outline-none focus:ring-1 focus:ring-white/20"
              key={track.id}
              onKeyUp={({ code }) => code === "Enter" && playTrack(track)}
            >
              {({ selected }) => (
                <TrackBanner
                  track={track}
                  onAdd={addTrack}
                  onRemove={removeTrack}
                  on={tracksMap.has(track.id) ? "REMOVE" : "ADD"}
                  onPlay={playTrack}
                  playing={
                    Boolean(currentTrack) &&
                    currentTrack?.id === track.id &&
                    playing
                  }
                  selected={selected}
                />
              )}
            </List.Item>
          ))}
        </List.Root>
      </div>
      <div className="scrollbar-hide relative flex h-screen flex-1 flex-col gap-2 overflow-y-auto px-2 pb-24 pt-0.5">
        <div className="sticky top-0 z-10 flex flex-col gap-2 bg-black/10 py-2 pt-20 backdrop-blur-sm">
          <div className="px-4 pb-2">
            <button
              disabled={isSubmitting || isLoading || isSuccess}
              type="submit"
              form="edit-playlist"
              className="w-full rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105 disabled:opacity-75"
            >
              Sauvegarder
            </button>
          </div>
          <div className="flex flex-grow items-center justify-center gap-4">
            <AlbumInput
              form="edit-playlist"
              name={f0rm.fields.image().name()}
              playlist={playlist}
              mockAlbumsPicture={mockAlbumsPicture}
            />
            <form
              onSubmit={f0rm.form.submit}
              id="edit-playlist"
              className="flex flex-[2] flex-col gap-2"
            >
              <div>
                <label
                  htmlFor={f0rm.fields.name().name()}
                  className="font-semibold"
                >
                  Nom
                </label>
                <input
                  id={f0rm.fields.name().name()}
                  name={f0rm.fields.name().name()}
                  data-error={!!f0rm.errors.name().errors()?.length}
                  defaultValue={playlist?.name}
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500 data-[error=true]:border-red-500"
                />
              </div>
              <div>
                <label
                  htmlFor={f0rm.fields.description().name()}
                  className="font-semibold"
                >
                  Description
                </label>
                <input
                  id={f0rm.fields.description().name()}
                  name={f0rm.fields.description().name()}
                  defaultValue={playlist?.description ?? undefined}
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                />
              </div>
            </form>
          </div>
        </div>
        <RemoveModal
          ref={modal}
          current={currentRemoveTrack.current}
          remove={removeTrack}
          reset={resetTracks}
        />
        <List.Root
          className="flex flex-1 flex-col gap-2 p-4"
          ref={autoAnimateRef}
        >
          {!tracksMap.size && (
            <List.NotItem>
              <ErrorMessages errors={f0rm.errors.tracks().errors()} />
            </List.NotItem>
          )}
          {[...tracksMap].map(([_, track], index) => (
            <List.Item
              key={track.id}
              className="outline-none focus:ring-1 focus:ring-white/20"
              onKeyUp={({ code }) => code === "Enter" && playTrack(track)}
            >
              {({ selected }) => (
                <>
                  <input
                    form="edit-playlist"
                    type="hidden"
                    value={track.id}
                    name={f0rm.fields.tracks(index).id().name()}
                  />
                  <TrackBanner
                    track={track}
                    onRemove={handleRemoveTrack}
                    onPlay={playTrack}
                    playing={
                      Boolean(currentTrack) &&
                      currentTrack?.id === track.id &&
                      playing
                    }
                    selected={selected}
                  />
                </>
              )}
            </List.Item>
          ))}
        </List.Root>
      </div>
    </div>
  );
};

const PlaylistEditWrapper: NextPageWithLayout & NextPageWithTitle = () => {
  const router = useRouter();
  const { isLoading } = api.user.can_track_api.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess(can) {
      if (!can) router.push("/dashboard");
    },
  });

  if (isLoading) return <Noop />;

  return (
    <TrackPlayer>
      <PlaylistEdit />
    </TrackPlayer>
  );
};

export default PlaylistEditWrapper;

PlaylistEditWrapper.getLayout = GetLayoutThrough;
PlaylistEditWrapper.title = (_) => {
  const { query } = useRouter();
  const id = getQuery(query.id);

  const { data, isLoading } = api.playlist.get_playlist.useQuery(
    { id: id! },
    {
      enabled: id !== undefined,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );

  if (!data) return;

  return `Playlists | Edit | ${data.name}`;
};
