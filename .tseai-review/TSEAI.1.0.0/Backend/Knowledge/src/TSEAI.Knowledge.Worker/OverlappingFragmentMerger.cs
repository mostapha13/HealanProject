namespace TSEAI.Knowledge.Worker;

public static class OverlappingFragmentMerger
{
    public static string Merge(IEnumerable<string?> fragments)
    {
        var result="";
        foreach(var raw in fragments)
        {
            var next=(raw??"").Trim();
            if(next.Length==0) continue;
            if(result.Length==0) { result=next; continue; }
            var max=Math.Min(Math.Min(result.Length,next.Length),512);
            var overlap=0;
            for(var size=max;size>=8;size--)
            {
                if(!result.EndsWith(next[..size],StringComparison.Ordinal)) continue;
                overlap=size; break;
            }
            result += overlap>0 ? next[overlap..] : " "+next;
        }
        return result.Trim();
    }
}
