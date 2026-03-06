import { useMediaSlider } from "@/hooks/use-media";
import BackgroundSlideshow from "@/components/shared/BackgroundSlideshow";

const MediaSlider = () => {
  const { data: items } = useMediaSlider();

  return (
    <BackgroundSlideshow
      items={items ?? []}
      overlayClassName="bg-black/30"
      fallback={
        <>
          <div className="absolute inset-0 bg-neutral-800" />
          <div className="absolute inset-0 bg-black/50" />
        </>
      }
    />
  );
};

export default MediaSlider;
