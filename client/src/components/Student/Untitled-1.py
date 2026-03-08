def merge(nums1,m, nums2,n):
    """
    Do not return anything, modify nums1 in-place instead.
    """
    nums1=nums1+nums2
    nums1=nums1.sort()
    return nums1
nums1 = [1,2,3,0,0,0]
m = 3
nums2 = [2,5,6]         
n = 3
merge(nums1,m,nums2,n)
