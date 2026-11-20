import { ScrubSection } from '../components/ScrubSection';
import { SectionIntro } from '../components/SectionIntro';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { Breakdown } from './Breakdown';
import { sm, clamp } from '../lib/math';

/** 05 · Inside. Cinematic shots 4–5, then the hands-on 3D breakdown. */
export function Inside() {
  return (
    <section id="inside">
      <SectionIntro label="05 · Inside" line1="Ten layers." line2="Take it apart." instruction="Scroll to separate it. Then pull it apart yourself." />
      <ScrubSection length="240vh" label="Exploded view">
        {p => (
          <>
            <FrameSequence shots={[4, 5]} progress={p} />
            <Readouts items={[['Orbit', `${Math.round(clamp((p - 0.45) / 0.55, 0, 1) * 359)}°`], ['Layers', `${Math.round(sm(0, 0.45, p) * 10)}/10`]]} />
          </>
        )}
      </ScrubSection>
      <Breakdown />
    </section>
  );
}
