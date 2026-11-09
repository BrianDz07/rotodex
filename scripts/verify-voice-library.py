"""Verify every referenced prerecorded MP3 exists and has valid audio metadata."""
import concurrent.futures,json,pathlib,subprocess,sys
root=pathlib.Path(sys.argv[1]);catalog=json.loads((root/'voice-catalog.json').read_text())
records=list(catalog['entries'].values())+list(catalog['phrases'].values())
assert len(catalog['entries'])==1025
missing=[r['audio'] for r in records if not (root/r['audio']).is_file()]
if missing:raise SystemExit(f'Missing {len(missing)} recordings: {missing[:8]}')
def check(record):
 path=root/record['audio'];assert path.stat().st_size>1500,path
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels','-of','json',str(path)]))
 assert float(info['format']['duration'])>.5,path
 assert info['streams'][0]['codec_name']=='mp3',path
 return float(info['format']['duration'])
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:durations=list(pool.map(check,records))
size=sum((root/r['audio']).stat().st_size for r in records)
print(json.dumps({'recordings':len(records),'total_audio_minutes':round(sum(durations)/60,1),'size_mb':round(size/1024**2,1),'min_duration':min(durations),'max_duration':max(durations)}))
